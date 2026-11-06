import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client.ts";
import { decodeCursor, encodeCursor } from "../src/pagination.ts";
import {
  idempotencyRepo,
  notebookRepo,
  profiles,
  sourceRepo,
  uploadRepo,
} from "../src/repositories.ts";
import { createUser, setupTestDb } from "./helpers.ts";

let db: Database;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await setupTestDb());
});
afterAll(async () => close());

describe("pagination cursors", () => {
  it("round-trips and rejects garbage", () => {
    const c = {
      createdAt: new Date("2026-11-06T00:00:00.000Z"),
      id: "0190f5b4-3a8e-7c3e-9a2b-1c2d3e4f5a6b",
    };
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(decodeCursor(btoa('["x","y"]'))).toBeNull();
  });
});

describe("notebookRepo", () => {
  it("is tenant-scoped: another user's notebook is invisible", async () => {
    const alice = await createUser(db);
    const bob = await createUser(db);
    const nb = await notebookRepo.create(db, alice.id, { title: "Transformers" });
    expect(await notebookRepo.get(db, alice.id, nb.id)).not.toBeNull();
    expect(await notebookRepo.get(db, bob.id, nb.id)).toBeNull();
    expect(await notebookRepo.update(db, bob.id, nb.id, { title: "hijack" })).toBeNull();
    expect(await notebookRepo.softDelete(db, bob.id, nb.id)).toBe(false);
  });

  it("paginates newest-first with a stable cursor", async () => {
    const u = await createUser(db);
    for (let i = 0; i < 5; i++) await notebookRepo.create(db, u.id, { title: `nb ${i}` });
    const p1 = await notebookRepo.list(db, u.id, { limit: 2, cursor: null });
    expect(p1.items.map((n) => n.title)).toEqual(["nb 4", "nb 3"]);
    expect(p1.nextCursor).not.toBeNull();
    const p2 = await notebookRepo.list(db, u.id, {
      limit: 2,
      cursor: decodeCursor(p1.nextCursor ?? ""),
    });
    expect(p2.items.map((n) => n.title)).toEqual(["nb 2", "nb 1"]);
    const p3 = await notebookRepo.list(db, u.id, {
      limit: 2,
      cursor: decodeCursor(p2.nextCursor ?? ""),
    });
    expect(p3.items.map((n) => n.title)).toEqual(["nb 0"]);
    expect(p3.nextCursor).toBeNull();
  });

  it("does not skip rows that share a millisecond (regression: µs vs ms cursor)", async () => {
    const u = await createUser(db);
    for (const us of ["123100", "123200", "123300"]) {
      const nb = await notebookRepo.create(db, u.id, { title: `t${us}` });
      await db.execute(
        sql`UPDATE notebooks SET created_at = ${`2026-11-06T10:00:00.${us}Z`}::timestamptz WHERE id = ${nb.id}`,
      );
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await notebookRepo.list(db, u.id, {
        limit: 1,
        cursor: cursor ? decodeCursor(cursor) : null,
      });
      seen.push(...page.items.map((n) => n.title));
      cursor = page.nextCursor;
    } while (cursor);
    expect(seen.sort()).toEqual(["t123100", "t123200", "t123300"]);
  });

  it("lockLive sees live notebooks only", async () => {
    const u = await createUser(db);
    const nb = await notebookRepo.create(db, u.id, { title: "lock me" });
    expect(await db.transaction((tx) => notebookRepo.lockLive(tx, u.id, nb.id))).toBe(true);
    await notebookRepo.softDelete(db, u.id, nb.id);
    expect(await db.transaction((tx) => notebookRepo.lockLive(tx, u.id, nb.id))).toBe(false);
  });

  it("soft-deletes the notebook and its sources", async () => {
    const u = await createUser(db);
    const nb = await notebookRepo.create(db, u.id, { title: "To delete" });
    const src = await sourceRepo.create(db, u.id, {
      notebookId: nb.id,
      kind: "web",
      title: "Blog",
      originUrl: "https://example.com",
      addedVia: "url",
    });
    expect(await notebookRepo.softDelete(db, u.id, nb.id)).toBe(true);
    expect(await notebookRepo.get(db, u.id, nb.id)).toBeNull();
    expect(await sourceRepo.get(db, u.id, src.id)).toBeNull();
    expect(await notebookRepo.softDelete(db, u.id, nb.id)).toBe(false);
  });

  it("enforces title length in the database", async () => {
    const u = await createUser(db);
    await expect(notebookRepo.create(db, u.id, { title: "" })).rejects.toThrow();
    await expect(notebookRepo.create(db, u.id, { title: "x".repeat(201) })).rejects.toThrow();
  });
});

describe("uploadRepo", () => {
  it("moves pending → completed → consumed exactly once", async () => {
    const u = await createUser(db);
    const up = await uploadRepo.create(db, u.id, {
      filename: "paper.pdf",
      declaredMime: "application/pdf",
      declaredSize: 1000,
      expiresAt: new Date(Date.now() + 3600e3),
    });
    expect(up.storageKey).toBe(`uploads/${u.id}/${up.id}`);
    expect(await uploadRepo.consume(db, u.id, up.id)).toBeNull(); // not completed yet
    const done = await uploadRepo.markCompleted(db, u.id, up.id, {
      byteSize: 1000,
      detectedMime: "application/pdf",
      sha256: "ab",
      etag: "e1",
    });
    expect(done?.status).toBe("completed");
    expect(
      await uploadRepo.markCompleted(db, u.id, up.id, {
        byteSize: 1,
        detectedMime: "x",
        sha256: "y",
        etag: "e2",
      }),
    ).toBeNull();
    const [a, b] = await Promise.all([
      uploadRepo.consume(db, u.id, up.id),
      uploadRepo.consume(db, u.id, up.id),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });
});

describe("idempotencyRepo", () => {
  it("lets exactly one concurrent claim win", async () => {
    const u = await createUser(db);
    const input = {
      key: "key-12345678",
      method: "POST",
      path: "/v1/notebooks",
      requestHash: "h1",
      ttlSeconds: 60,
    };
    const results = await Promise.all(
      Array.from({ length: 5 }, () => idempotencyRepo.claim(db, u.id, input)),
    );
    expect(results.filter((r) => r.claimed)).toHaveLength(1);
    await idempotencyRepo.complete(db, u.id, input.key, {
      status: 201,
      body: { id: "x" },
      headers: {},
    });
    const again = await idempotencyRepo.claim(db, u.id, input);
    expect(again.claimed).toBe(false);
    if (!again.claimed) expect(again.existing.state).toBe("completed");
  });

  it("a stale in-progress claim (crashed request) can be reclaimed after the lease", async () => {
    const u = await createUser(db);
    const input = {
      key: "key-stale-123",
      method: "POST",
      path: "/x",
      requestHash: "h",
      ttlSeconds: 60,
    };
    expect((await idempotencyRepo.claim(db, u.id, input)).claimed).toBe(true);
    expect((await idempotencyRepo.claim(db, u.id, input)).claimed).toBe(false);
    await db.execute(sql`UPDATE idempotency_keys SET created_at = now() - interval '2 minutes'`);
    expect((await idempotencyRepo.claim(db, u.id, { ...input, leaseSeconds: 60 })).claimed).toBe(
      true,
    );
  });

  it("release frees an in-progress claim", async () => {
    const u = await createUser(db);
    const input = {
      key: "key-abcdefgh",
      method: "POST",
      path: "/x",
      requestHash: "h",
      ttlSeconds: 60,
    };
    expect((await idempotencyRepo.claim(db, u.id, input)).claimed).toBe(true);
    await idempotencyRepo.release(db, u.id, input.key);
    expect((await idempotencyRepo.claim(db, u.id, input)).claimed).toBe(true);
  });
});

describe("profiles", () => {
  it("upserts", async () => {
    const u = await createUser(db);
    expect(await profiles.get(db, u.id)).toBeNull();
    await profiles.upsert(db, u.id, { goals: "learn ML" });
    const p = await profiles.upsert(db, u.id, { level: "beginner", isOnboarded: true });
    expect(p).toMatchObject({ goals: "learn ML", level: "beginner", isOnboarded: true });
  });
});
