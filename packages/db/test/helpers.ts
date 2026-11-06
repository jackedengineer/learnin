import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb, type Database } from "../src/client.ts";
import { newId } from "../src/ids.ts";
import { users } from "../src/schema.ts";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://doubtless:doubtless@localhost:5432/doubtless_test";

/** Fresh schema per test file: drop everything, re-run committed migrations. */
export async function setupTestDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  const { db, close } = createDb(TEST_DATABASE_URL, { max: 1 });
  await db.execute(
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;",
  );
  await migrate(db, { migrationsFolder: new URL("../migrations", import.meta.url).pathname });
  return { db, close };
}

export async function createUser(db: Database, email = `${newId()}@example.com`) {
  const [u] = await db.insert(users).values({ id: newId(), name: "Test", email }).returning();
  if (!u) throw new Error("no user");
  return u;
}
