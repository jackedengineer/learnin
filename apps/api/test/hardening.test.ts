/** Regression tests for the Phase 0 security/correctness review findings. */
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { parseConfig } from "../src/lib/config.ts";
import { isDeletedUserViolation, safeErrorForLog } from "../src/lib/errors.ts";
import { sniffMime } from "../src/lib/storage.ts";
import { createHarness, json } from "./harness.ts";

type H = Awaited<ReturnType<typeof createHarness>>;
let h: H;
beforeAll(async () => {
  h = await createHarness();
});
afterAll(async () => h.close());

const PDF = new TextEncoder().encode("%PDF-1.7\n% test\n%%EOF\n");

async function notebook(cookie: string) {
  const res = await h.request("/v1/notebooks", {
    method: "POST",
    cookie,
    body: json({ title: "nb" }),
  });
  return ((await res.json()) as { id: string }).id;
}

async function uploadPdf(cookie: string) {
  const ticket = (await (
    await h.request("/v1/uploads", {
      method: "POST",
      cookie,
      body: json({ filename: "a.pdf", mime: "application/pdf", size: PDF.byteLength }),
    })
  ).json()) as { id: string; uploadUrl: string };
  await h.request(new URL(ticket.uploadUrl).pathname, {
    method: "PUT",
    cookie,
    headers: { "content-type": "application/pdf", "content-length": String(PDF.byteLength) },
    body: PDF,
  });
  return ticket.id;
}

describe("URL pre-check: trailing-dot and long-id bypasses", () => {
  it.each([
    "http://localhost./",
    "http://loc%61lhost./",
    "http://metadata.google.internal./computeMetadata/v1/",
    "http://printer.local./",
    "http://router.lan./",
    "http://a.localhost./",
    "http://example..com/",
  ])("blocks %s", async (url) => {
    const { cookie } = await h.signUp();
    const nb = await notebook(cookie);
    const res = await h.request(`/v1/notebooks/${nb}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "url", url }),
    });
    expect(res.status).toBe(422);
  });

  it("stores the normalised hostname", async () => {
    const { cookie } = await h.signUp();
    const nb = await notebook(cookie);
    const res = await h.request(`/v1/notebooks/${nb}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "url", url: "https://Example.com./post" }),
    });
    expect(await res.json()).toMatchObject({ originUrl: "https://example.com/post" });
  });

  it("an absurdly long YouTube id is a 201 with a generic title, not a 500", async () => {
    const { cookie } = await h.signUp();
    const nb = await notebook(cookie);
    const res = await h.request(`/v1/notebooks/${nb}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "url", url: `https://www.youtube.com/watch?v=${"a".repeat(400)}` }),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ kind: "youtube", title: "YouTube video" });
  });
});

describe("uploads", () => {
  it("binds the verified object version (etag) to the upload and the source", async () => {
    const { cookie } = await h.signUp();
    const nb = await notebook(cookie);
    const id = await uploadPdf(cookie);
    expect((await h.request(`/v1/uploads/${id}/complete`, { method: "POST", cookie })).status).toBe(
      200,
    );
    await h.request(`/v1/notebooks/${nb}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "upload", uploadId: id }),
    });
    const [row] = (await h.db.execute(
      sql`SELECT u.etag AS upload_etag, s.storage_etag AS source_etag FROM uploads u JOIN sources s ON s.upload_id = u.id WHERE u.id = ${id}`,
    )) as unknown as { upload_etag: string; source_etag: string }[];
    const stored = [...h.r2.store.entries()].find(([k]) => k.endsWith(id))?.[1];
    expect(row?.upload_etag).toBe(stored?.etag);
    expect(row?.source_etag).toBe(stored?.etag);
    // Overwriting after verification is refused in worker mode…
    const again = await h.request(`/v1/uploads/${id}/content`, {
      method: "PUT",
      cookie,
      headers: { "content-type": "application/pdf", "content-length": String(PDF.byteLength) },
      body: PDF,
    });
    expect(again.status).toBe(409);
  });

  it("…and a racing overwrite between size check and sniff is detected", async () => {
    const { cookie } = await h.signUp();
    const id = await uploadPdf(cookie);
    const key = [...h.r2.store.keys()].find((k) => k.endsWith(id)) as string;
    const realGet = h.r2.get.bind(h.r2);
    h.r2.get = async (k, opts) => {
      await h.r2.put(key, PDF); // new etag lands after head(), before the sniffing read
      return realGet(k, opts);
    };
    try {
      const res = await h.request(`/v1/uploads/${id}/complete`, { method: "POST", cookie });
      expect(res.status).toBe(409);
      expect(await res.json()).toMatchObject({ code: "upload.changed" });
    } finally {
      h.r2.get = realGet;
    }
  });

  it("complete refuses an expired ticket (410)", async () => {
    const { cookie } = await h.signUp();
    const id = await uploadPdf(cookie);
    await h.db.execute(
      sql`UPDATE uploads SET expires_at = now() - interval '1 day' WHERE id = ${id}`,
    );
    expect((await h.request(`/v1/uploads/${id}/complete`, { method: "POST", cookie })).status).toBe(
      410,
    );
  });

  it("non-UUID upload id on the byte sink is a 404, not a 500", async () => {
    const { cookie } = await h.signUp();
    const res = await h.request("/v1/uploads/not-a-uuid/content", {
      method: "PUT",
      cookie,
      headers: { "content-length": "3" },
      body: "abc",
    });
    expect(res.status).toBe(404);
  });

  it("caps unfinished uploads per user (429)", async () => {
    const { cookie } = await h.signUp();
    const start = () =>
      h.request("/v1/uploads", {
        method: "POST",
        cookie,
        body: json({ filename: "a.pdf", mime: "application/pdf", size: 10 }),
      });
    for (let i = 0; i < 30; i++) expect((await start()).status).toBe(201);
    const res = await start();
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ code: "upload.rate_limited" });
  });

  it("magic-byte sniffing rejects invalid UTF-8 'text' and non-docx ZIPs", () => {
    const junk = new Uint8Array(5000).fill(0xc3); // invalid UTF-8, no NUL bytes
    expect(sniffMime(junk, "text/plain")).toBeNull();
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new TextEncoder().encode("random.bin")]);
    expect(
      sniffMime(zip, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ).toBeNull();
    const docx = new Uint8Array([
      0x50,
      0x4b,
      0x03,
      0x04,
      ...new TextEncoder().encode("[Content_Types].xml"),
    ]);
    expect(
      sniffMime(docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const longText = new TextEncoder().encode(`${"é".repeat(2500)}`); // multi-byte char cut at the sample edge
    expect(sniffMime(longText, "text/plain")).toBe("text/plain");
  });
});

describe("origin checks (CSRF defence in depth)", () => {
  it("refuses a mutating request from a foreign Origin", async () => {
    const { cookie } = await h.signUp();
    const res = await h.app.request(
      "http://localhost:8787/v1/notebooks",
      {
        method: "POST",
        headers: { origin: "https://evil.example", cookie, "content-type": "application/json" },
        body: json({ title: "x" }),
      },
      h.env,
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "request.forbidden_origin" });
  });

  it("Better Auth refuses sign-up from a foreign Origin even under the test runner", async () => {
    const res = await h.app.request(
      "http://localhost:8787/v1/auth/sign-up/email",
      {
        method: "POST",
        headers: { origin: "https://evil.example", "content-type": "application/json" },
        body: json({ email: "x@example.com", password: "correct-horse-battery", name: "x" }),
      },
      h.env,
    );
    expect(res.status).toBe(403);
  });
});

describe("deleted accounts and logging", () => {
  it("an old cached-session cookie after account deletion gets 401, not 500", async () => {
    const { cookie } = await h.signUp();
    expect((await h.request("/v1/me", { method: "DELETE", cookie })).status).toBe(204);
    const res = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      body: json({ title: "ghost" }),
    });
    expect(res.status).toBe(401);
  });

  it("database errors are logged without SQL parameters", () => {
    const err = Object.assign(
      new Error('Failed query: insert into "notebooks" ... params: secret-token,me@example.com'),
      {
        cause: {
          code: "23505",
          constraint_name: "x_key",
          table_name: "notebooks",
          severity: "ERROR",
        },
      },
    );
    const logged = JSON.stringify(safeErrorForLog(err));
    expect(logged).not.toContain("secret-token");
    expect(logged).not.toContain("me@example.com");
    expect(logged).toContain("23505");
    expect(
      isDeletedUserViolation({
        cause: {
          code: "23503",
          constraint_name: "notebooks_user_id_users_id_fk",
          severity: "ERROR",
        },
      }),
    ).toBe(true);
  });

  it("unexpected errors in handlers don't leak details to the client", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { cookie } = await h.signUp();
    await h.db.execute(sql`ALTER TABLE notebooks RENAME COLUMN title TO title_tmp`);
    try {
      const res = await h.request("/v1/notebooks", {
        method: "POST",
        cookie,
        body: json({ title: "my private title" }),
      });
      expect(res.status).toBe(500);
      expect(JSON.stringify(await res.json())).not.toContain("private");
      expect(JSON.stringify(spy.mock.calls)).not.toContain("my private title");
    } finally {
      await h.db.execute(sql`ALTER TABLE notebooks RENAME COLUMN title_tmp TO title`);
      spy.mockRestore();
    }
  });
});

describe("config guards", () => {
  it("dev login requires a localhost BETTER_AUTH_URL", () => {
    expect(() =>
      parseConfig({
        ENVIRONMENT: "development",
        BETTER_AUTH_URL: "https://staging.doubtless.app",
        BETTER_AUTH_SECRET: "x".repeat(40),
        ALLOW_DEV_LOGIN: "true",
      }),
    ).toThrow(/localhost/);
  });
});
