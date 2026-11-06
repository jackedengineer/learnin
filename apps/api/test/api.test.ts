import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseConfig } from "../src/lib/config.ts";
import { createHarness, json } from "./harness.ts";

type H = Awaited<ReturnType<typeof createHarness>>;
let h: H;

beforeAll(async () => {
  h = await createHarness();
});
afterAll(async () => h.close());

const PDF = new TextEncoder().encode("%PDF-1.7\n% test document\n1 0 obj << >> endobj\n%%EOF\n");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

async function newNotebook(cookie: string, title = "Transformers") {
  const res = await h.request("/v1/notebooks", { method: "POST", cookie, body: json({ title }) });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; title: string };
}

describe("meta", () => {
  it("health responds with a request id and no-store", async () => {
    const res = await h.request("/v1/health?deep=1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", environment: "test", db: "ok" });
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("echoes a well-formed incoming request id", async () => {
    const res = await h.request("/v1/health", { headers: { "x-request-id": "req-abc-12345" } });
    expect(res.headers.get("x-request-id")).toBe("req-abc-12345");
  });

  it("serves an OpenAPI 3.1 document", async () => {
    const res = await h.request("/v1/openapi.json");
    const doc = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(doc.openapi).toBe("3.1.0");
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        "/v1/notebooks",
        "/v1/notebooks/{id}",
        "/v1/notebooks/{notebookId}/sources",
      ]),
    );
  });

  it("unknown routes: 401 when signed out (no route probing), 404 problem+json when signed in", async () => {
    expect((await h.request("/v1/nope")).status).toBe(401);
    const { cookie } = await h.signUp();
    const res = await h.request("/v1/nope", { cookie });
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
  });
});

describe("auth", () => {
  it("protected routes need a session (401 problem+json)", async () => {
    const res = await h.request("/v1/notebooks");
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    expect(await res.json()).toMatchObject({ status: 401, code: "auth.required" });
  });

  it("sign-up creates a learner profile; /v1/me returns it", async () => {
    const { cookie, email } = await h.signUp();
    const res = await h.request("/v1/me", { cookie });
    expect(res.status).toBe(200);
    const me = (await res.json()) as { user: { email: string }; profile: { isOnboarded: boolean } };
    expect(me.user.email).toBe(email);
    expect(me.profile.isOnboarded).toBe(false);

    const upd = await h.request("/v1/me/profile", {
      method: "PATCH",
      cookie,
      body: json({ goals: "Implement a transformer", level: "knows Python", isOnboarded: true }),
    });
    expect(upd.status).toBe(200);
    expect(await upd.json()).toMatchObject({ goals: "Implement a transformer", isOnboarded: true });
  });

  it("allow-list blocks sign-ups from other emails", async () => {
    const restricted = await createHarness({ ALLOWED_EMAILS: "owner@example.com" });
    try {
      await expect(restricted.signUp("stranger@example.com")).rejects.toThrow(
        /sign-up failed: 403/,
      );
      await expect(restricted.signUp("Owner@Example.com")).resolves.toBeTruthy();
    } finally {
      await restricted.close();
    }
    h = await createHarness(); // the restricted harness reset the shared test schema
  });

  it("refuses dev login in production config", () => {
    expect(() =>
      parseConfig({
        ENVIRONMENT: "production",
        BETTER_AUTH_URL: "https://doubtless.app",
        BETTER_AUTH_SECRET: "x".repeat(40),
        ALLOW_DEV_LOGIN: "true",
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "secret",
      }),
    ).toThrow(/ALLOW_DEV_LOGIN/);
  });
});

describe("notebooks", () => {
  it("CRUD round-trip with Location header and 204 delete", async () => {
    const { cookie } = await h.signUp();
    const created = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      body: json({ title: "  Linear Algebra  ", level: "beginner" }),
    });
    expect(created.status).toBe(201);
    const nb = (await created.json()) as { id: string; title: string; answerMode: string };
    expect(created.headers.get("location")).toBe(`/v1/notebooks/${nb.id}`);
    expect(nb.title).toBe("Linear Algebra");
    expect(nb.answerMode).toBe("default");

    const patched = await h.request(`/v1/notebooks/${nb.id}`, {
      method: "PATCH",
      cookie,
      body: json({ answerMode: "tutor", answerLength: "shorter" }),
    });
    expect(await patched.json()).toMatchObject({ answerMode: "tutor", answerLength: "shorter" });

    expect((await h.request(`/v1/notebooks/${nb.id}`, { method: "DELETE", cookie })).status).toBe(
      204,
    );
    expect((await h.request(`/v1/notebooks/${nb.id}`, { cookie })).status).toBe(404);
  });

  it("validation errors are 422 with field paths; unknown fields are rejected", async () => {
    const { cookie } = await h.signUp();
    const res = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      body: json({ title: "" }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string; errors: { path: string }[] };
    expect(body.code).toBe("validation.failed");
    expect(body.errors[0]?.path).toBe("title");

    const extra = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      body: json({ title: "ok", owner: "x" }),
    });
    expect(extra.status).toBe(422);
  });

  it("malformed JSON is a 400 problem", async () => {
    const { cookie } = await h.signUp();
    const res = await h.request("/v1/notebooks", { method: "POST", cookie, body: "{nope" });
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
  });

  it("another user's notebook is a 404, never 403", async () => {
    const alice = await h.signUp();
    const bob = await h.signUp();
    const nb = await newNotebook(alice.cookie);
    for (const [method, body] of [
      ["GET", undefined],
      ["PATCH", json({ title: "x" })],
      ["DELETE", undefined],
    ] as const) {
      const res = await h.request(`/v1/notebooks/${nb.id}`, { method, cookie: bob.cookie, body });
      expect(res.status).toBe(404);
    }
    expect((await h.request(`/v1/notebooks/${nb.id}/sources`, { cookie: bob.cookie })).status).toBe(
      404,
    );
  });

  it("cursor pagination walks every item exactly once", async () => {
    const { cookie } = await h.signUp();
    for (let i = 0; i < 5; i++) await newNotebook(cookie, `nb ${i}`);
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const qs: string = cursor ? `?limit=2&cursor=${encodeURIComponent(cursor)}` : "?limit=2";
      const page = (await (await h.request(`/v1/notebooks${qs}`, { cookie })).json()) as {
        data: { title: string }[];
        nextCursor: string | null;
      };
      seen.push(...page.data.map((n) => n.title));
      cursor = page.nextCursor;
    } while (cursor);
    expect(seen).toEqual(["nb 4", "nb 3", "nb 2", "nb 1", "nb 0"]);
    expect((await h.request("/v1/notebooks?cursor=garbage", { cookie })).status).toBe(422);
  });
});

describe("idempotency", () => {
  it("replays the original response for the same key + body", async () => {
    const { cookie } = await h.signUp();
    const headers = { "idempotency-key": crypto.randomUUID() };
    const first = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      headers,
      body: json({ title: "Once" }),
    });
    const second = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      headers,
      body: json({ title: "Once" }),
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.headers.get("idempotent-replayed")).toBe("true");
    expect(second.headers.get("location")).toBe(first.headers.get("location"));
    expect(((await second.json()) as { id: string }).id).toBe(
      ((await first.json()) as { id: string }).id,
    );
    const list = (await (await h.request("/v1/notebooks", { cookie })).json()) as {
      data: unknown[];
    };
    expect(list.data).toHaveLength(1);
  });

  it("rejects the same key with a different body (422)", async () => {
    const { cookie } = await h.signUp();
    const headers = { "idempotency-key": crypto.randomUUID() };
    await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      headers,
      body: json({ title: "A" }),
    });
    const res = await h.request("/v1/notebooks", {
      method: "POST",
      cookie,
      headers,
      body: json({ title: "B" }),
    });
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "idempotency.key_reused" });
  });

  it("a failed request releases the key so a corrected retry can succeed", async () => {
    const { cookie } = await h.signUp();
    const headers = { "idempotency-key": crypto.randomUUID() };
    const bad = await h.request("/v1/notebooks/00000000-0000-7000-8000-000000000000/sources", {
      method: "POST",
      cookie,
      headers,
      body: json({ type: "url", url: "https://example.com/a" }),
    });
    expect(bad.status).toBe(404);
    const nb = await newNotebook(cookie);
    const ok = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      headers: { "idempotency-key": crypto.randomUUID() },
      body: json({ type: "url", url: "https://example.com/a" }),
    });
    expect(ok.status).toBe(201);
  });

  it("keys are scoped per user", async () => {
    const a = await h.signUp();
    const b = await h.signUp();
    const headers = { "idempotency-key": "shared-key-123" };
    const r1 = await h.request("/v1/notebooks", {
      method: "POST",
      cookie: a.cookie,
      headers,
      body: json({ title: "A" }),
    });
    const r2 = await h.request("/v1/notebooks", {
      method: "POST",
      cookie: b.cookie,
      headers,
      body: json({ title: "B" }),
    });
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r2.headers.get("idempotent-replayed")).toBeNull();
  });
});

describe("uploads → sources", () => {
  async function upload(cookie: string, bytes: Uint8Array, mime: string, filename = "paper.pdf") {
    const ticketRes = await h.request("/v1/uploads", {
      method: "POST",
      cookie,
      body: json({ filename, mime, size: bytes.byteLength }),
    });
    expect(ticketRes.status).toBe(201);
    const ticket = (await ticketRes.json()) as {
      id: string;
      uploadUrl: string;
      headers: Record<string, string>;
    };
    const put = await h.request(new URL(ticket.uploadUrl).pathname, {
      method: "PUT",
      cookie,
      headers: { ...ticket.headers, "content-length": String(bytes.byteLength) },
      body: bytes,
    });
    expect(put.status).toBe(204);
    return ticket.id;
  }

  it("upload → complete → source (kind from sniffed type)", async () => {
    const { cookie } = await h.signUp();
    const nb = await newNotebook(cookie);
    const uploadId = await upload(cookie, PDF, "application/pdf");
    const done = await h.request(`/v1/uploads/${uploadId}/complete`, { method: "POST", cookie });
    expect(await done.json()).toMatchObject({
      status: "completed",
      detectedMime: "application/pdf",
    });

    const src = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "upload", uploadId }),
    });
    expect(src.status).toBe(201);
    expect(await src.json()).toMatchObject({
      kind: "pdf",
      title: "paper.pdf",
      status: "pending",
      addedVia: "upload",
    });

    const reuse = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "upload", uploadId }),
    });
    expect(reuse.status).toBe(409);
  });

  it("rejects a file whose bytes don't match the declared type and deletes it", async () => {
    const { cookie } = await h.signUp();
    const uploadId = await upload(cookie, PNG, "application/pdf");
    const res = await h.request(`/v1/uploads/${uploadId}/complete`, { method: "POST", cookie });
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: "upload.type_mismatch" });
    expect([...h.r2.store.keys()].some((k) => k.endsWith(uploadId))).toBe(false);
  });

  it("rejects a body whose length differs from the declaration", async () => {
    const { cookie } = await h.signUp();
    const ticket = (await (
      await h.request("/v1/uploads", {
        method: "POST",
        cookie,
        body: json({ filename: "a.pdf", mime: "application/pdf", size: 999 }),
      })
    ).json()) as { uploadUrl: string };
    const put = await h.request(new URL(ticket.uploadUrl).pathname, {
      method: "PUT",
      cookie,
      headers: { "content-type": "application/pdf", "content-length": String(PDF.byteLength) },
      body: PDF,
    });
    expect(put.status).toBe(422);
  });

  it("declared MIME types outside the allow-list are rejected", async () => {
    const { cookie } = await h.signUp();
    const res = await h.request("/v1/uploads", {
      method: "POST",
      cookie,
      body: json({ filename: "x.exe", mime: "application/x-msdownload", size: 10 }),
    });
    expect(res.status).toBe(422);
  });

  it("someone else's upload can't be completed or used", async () => {
    const alice = await h.signUp();
    const bob = await h.signUp();
    const uploadId = await upload(alice.cookie, PDF, "application/pdf");
    expect(
      (await h.request(`/v1/uploads/${uploadId}/complete`, { method: "POST", cookie: bob.cookie }))
        .status,
    ).toBe(404);
    const nb = await newNotebook(bob.cookie);
    const res = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie: bob.cookie,
      body: json({ type: "upload", uploadId }),
    });
    expect(res.status).toBe(404);
  });
});

describe("url and text sources", () => {
  it("detects YouTube and strips fragments", async () => {
    const { cookie } = await h.signUp();
    const nb = await newNotebook(cookie);
    const yt = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "url", url: "https://www.youtube.com/watch?v=kCc8FmEb1nY#t=10" }),
    });
    expect(await yt.json()).toMatchObject({
      kind: "youtube",
      title: "YouTube video kCc8FmEb1nY",
      originUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
    });
    const web = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "url", url: "https://nlp.seas.harvard.edu/annotated-transformer/" }),
    });
    expect(await web.json()).toMatchObject({
      kind: "web",
      title: "nlp.seas.harvard.edu/annotated-transformer/",
    });
  });

  it.each([
    "http://localhost:3000/x",
    "http://127.0.0.1/admin",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "https://user:pw@example.com/",
    "ftp://example.com/file",
    "http://intranet/",
    "https://example.com:8443/",
    "http://printer.local/",
  ])("blocks unsafe URL %s", async (url) => {
    const { cookie } = await h.signUp();
    const nb = await newNotebook(cookie);
    const res = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "url", url }),
    });
    expect(res.status).toBe(422);
  });

  it("stores pasted text in R2 and supports select/rename/delete", async () => {
    const { cookie } = await h.signUp();
    const nb = await newNotebook(cookie);
    const res = await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "text", title: "My notes", text: "Attention is all you need." }),
    });
    const src = (await res.json()) as { id: string; kind: string; byteSize: number };
    expect(src).toMatchObject({ kind: "text", byteSize: 26 });

    const patched = await h.request(`/v1/sources/${src.id}`, {
      method: "PATCH",
      cookie,
      body: json({ isSelected: false, title: "Notes v2" }),
    });
    expect(await patched.json()).toMatchObject({ isSelected: false, title: "Notes v2" });

    const list = (await (await h.request(`/v1/notebooks/${nb.id}/sources`, { cookie })).json()) as {
      data: unknown[];
    };
    expect(list.data).toHaveLength(1);
    expect((await h.request(`/v1/sources/${src.id}`, { method: "DELETE", cookie })).status).toBe(
      204,
    );
    expect((await h.request(`/v1/sources/${src.id}`, { cookie })).status).toBe(404);
  });
});

describe("account deletion", () => {
  it("removes the user's data and blobs, and the session stops working", async () => {
    const { cookie } = await h.signUp();
    const nb = await newNotebook(cookie);
    await h.request(`/v1/notebooks/${nb.id}/sources`, {
      method: "POST",
      cookie,
      body: json({ type: "text", title: "t", text: "hello" }),
    });
    const me = (await (await h.request("/v1/me", { cookie })).json()) as { user: { id: string } };
    expect([...h.r2.store.keys()].some((k) => k.includes(me.user.id))).toBe(true);

    const del = await h.request("/v1/me", { method: "DELETE", cookie });
    expect(del.status).toBe(204);
    // This device's cookies are cleared by the response…
    const cleared = del.headers.getSetCookie().join("\n");
    expect(cleared).toMatch(/doubtless\.session_token=;/);
    expect(cleared).toMatch(/Max-Age=0/);
    expect([...h.r2.store.keys()].some((k) => k.includes(me.user.id))).toBe(false);
    // …and the session itself no longer exists server-side.
    const tokenOnly = cookie
      .split("; ")
      .filter((c) => c.startsWith("doubtless.session_token="))
      .join("; ");
    expect((await h.request("/v1/me", { cookie: tokenOnly })).status).toBe(401);
  });
});
