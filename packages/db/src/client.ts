import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

export type Database = ReturnType<typeof createDb>["db"];

/**
 * One client per request on Workers (Hyperdrive pools the real connections).
 * `fetch_types: false` skips a round trip on connect; we use no custom types.
 */
export function createDb(url: string, opts: { max?: number } = {}) {
  const sql = postgres(url, { max: opts.max ?? 5, fetch_types: false, prepare: true });
  const db = drizzle(sql, { schema });
  return { db, close: () => sql.end({ timeout: 5 }) };
}
