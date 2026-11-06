import { createDb, idempotencyRepo } from "@doubtless/db";
import { createMiddleware } from "hono/factory";
import { createAuth } from "./auth.ts";
import { parseConfig } from "./config.ts";
import type { AppEnv, DbFactory } from "./context.ts";
import { ApiError } from "./problem.ts";

/** Run after the response without blocking it; falls back to awaiting outside Workers. */
type WaitUntil = { waitUntil(p: Promise<unknown>): void };

export async function afterResponse(c: { executionCtx: WaitUntil }, p: Promise<unknown>) {
  let ctx: WaitUntil | undefined;
  try {
    ctx = c.executionCtx;
  } catch {
    ctx = undefined;
  }
  if (ctx) ctx.waitUntil(p);
  else await p;
}

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{8,128}$/;

export const requestContext = createMiddleware<AppEnv>(async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const requestId = incoming && REQUEST_ID_RE.test(incoming) ? incoming : crypto.randomUUID();
  c.set("requestId", requestId);
  const started = Date.now();
  await next();
  c.header("x-request-id", requestId);
  c.header("x-content-type-options", "nosniff");
  if (!c.res.headers.has("cache-control")) c.header("cache-control", "no-store");
  // Structured log line (Workers Logs indexes JSON fields). Never log bodies or tokens.
  console.log(
    JSON.stringify({
      level: c.res.status >= 500 ? "error" : "info",
      msg: "request",
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      durationMs: Date.now() - started,
      userId: c.var.user?.id,
    }),
  );
});

export const services = (dbFactory?: DbFactory) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = parseConfig(c.env as unknown as Record<string, unknown>);
    const { db, close } = dbFactory
      ? dbFactory(c.env)
      : createDb(c.env.HYPERDRIVE.connectionString, { max: 5 });
    c.set("config", config);
    c.set("db", db);
    c.set("auth", createAuth(config, db));
    try {
      await next();
    } finally {
      await afterResponse(c, close());
    }
  });

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const result = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
  if (!result) throw new ApiError(401, "auth.required", "Sign in required");
  c.set("user", result.user);
  c.set("session", result.session);
  await next();
});

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

/**
 * Honour `Idempotency-Key` on POST creates (ADR-0001):
 * atomic claim → 422 on payload mismatch → 409 while in flight → replay when completed.
 * Only successful (2xx) responses are stored; failures release the claim so the client can retry.
 */
export const idempotent = createMiddleware<AppEnv>(async (c, next) => {
  const key = c.req.header("idempotency-key");
  if (!key) return next();
  if (key.length < 8 || key.length > 255) {
    throw new ApiError(422, "idempotency.invalid_key", "Idempotency-Key must be 8–255 characters");
  }
  const userId = c.var.user.id;
  const path = new URL(c.req.url).pathname;
  const body = await c.req.raw.clone().text();
  const requestHash = await sha256Hex(`${c.req.method} ${path}\n${body}`);
  const result = await idempotencyRepo.claim(c.var.db, userId, {
    key,
    method: c.req.method,
    path,
    requestHash,
    ttlSeconds: IDEMPOTENCY_TTL_SECONDS,
  });

  if (!result.claimed) {
    const existing = result.existing;
    if (existing.requestHash !== requestHash) {
      throw new ApiError(
        422,
        "idempotency.key_reused",
        "Idempotency key reused with a different request",
      );
    }
    if (existing.state === "in_progress") {
      throw new ApiError(
        409,
        "idempotency.in_progress",
        "A request with this key is still in progress",
      );
    }
    return c.json(existing.responseBody as object, (existing.responseStatus ?? 200) as 200, {
      ...(existing.responseHeaders ?? {}),
      "idempotent-replayed": "true",
    });
  }

  try {
    await next();
  } catch (err) {
    await idempotencyRepo.release(c.var.db, userId, key);
    throw err;
  }
  if (c.error || !c.res.ok) {
    await idempotencyRepo.release(c.var.db, userId, key);
    return;
  }
  const headers: Record<string, string> = {};
  const location = c.res.headers.get("location");
  if (location) headers.location = location;
  await idempotencyRepo.complete(c.var.db, userId, key, {
    status: c.res.status,
    body: await c.res.clone().json(),
    headers,
  });
});
