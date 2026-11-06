import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://doubtless:doubtless@localhost:5432/doubtless",
  },
  strict: true,
  verbose: true,
});
