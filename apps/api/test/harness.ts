import type { Database } from "@doubtless/db";
import { createDb } from "@doubtless/db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createApp } from "../src/app.ts";
import { createFakeR2 } from "./fake-r2.ts";

export const ORIGIN = "http://localhost:8787";
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://doubtless:doubtless@localhost:5432/doubtless_test";

export async function createHarness(envOverrides: Record<string, string> = {}) {
  const { db, close } = createDb(TEST_DATABASE_URL, { max: 4 });
  await db.execute(
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;",
  );
  await migrate(db, {
    migrationsFolder: new URL("../../../packages/db/migrations", import.meta.url).pathname,
  });
  const r2 = createFakeR2();
  const app = createApp({ dbFactory: () => ({ db: db as Database, close: async () => {} }) });
  const env = {
    ENVIRONMENT: "test",
    BETTER_AUTH_URL: ORIGIN,
    BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
    TRUSTED_ORIGINS: ORIGIN,
    ALLOW_DEV_LOGIN: "true",
    ALLOWED_EMAILS: "",
    UPLOAD_MODE: "worker",
    UPLOADS: r2,
    HYPERDRIVE: { connectionString: TEST_DATABASE_URL },
    ...envOverrides,
  };
  const request = (path: string, init: RequestInit & { cookie?: string } = {}) => {
    const headers = new Headers(init.headers);
    headers.set("origin", ORIGIN);
    if (init.cookie) headers.set("cookie", init.cookie);
    if (init.body && typeof init.body === "string" && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return app.request(`${ORIGIN}${path}`, { ...init, headers }, env);
  };

  /** Dev-login sign-up (email+password is enabled only outside production). */
  async function signUp(email = `${crypto.randomUUID()}@example.com`) {
    const res = await request("/v1/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({ email, password: "correct-horse-battery", name: "Test User" }),
    });
    if (res.status !== 200) throw new Error(`sign-up failed: ${res.status} ${await res.text()}`);
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    return { email, cookie };
  }

  return { app, db, r2, env, request, signUp, close };
}

export const json = (body: unknown) => JSON.stringify(body);
