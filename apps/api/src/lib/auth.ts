import { type Database, newId, profiles, schema } from "@doubtless/db";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Config } from "./config.ts";

/**
 * Better Auth, Google sign-in only (ARCHITECTURE §6.4).
 * Email+password exists ONLY as a local dev/test login; config parsing refuses it in production.
 * Built per request because the DB client is per request (Workers best practice: no module state).
 */
export function createAuth(config: Config, db: Database) {
  return betterAuth({
    baseURL: config.baseUrl,
    basePath: "/v1/auth",
    secret: config.authSecret,
    trustedOrigins: config.trustedOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
      },
    }),
    advanced: {
      cookiePrefix: "doubtless",
      useSecureCookies: config.environment === "production",
      database: { generateId: () => newId() },
      // Keep CSRF/origin checks on everywhere, including under test runners.
      disableOriginCheck: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days, sliding
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    socialProviders: config.google
      ? {
          google: {
            clientId: config.google.clientId,
            clientSecret: config.google.clientSecret,
            prompt: "select_account",
          },
        }
      : {},
    emailAndPassword: { enabled: config.devLogin && config.environment !== "production" },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (config.allowedEmails && !config.allowedEmails.has(user.email.toLowerCase())) {
              throw new APIError("FORBIDDEN", {
                message: "This account is not on the allow-list.",
              });
            }
            return { data: user };
          },
          after: async (user) => {
            await profiles.upsert(db, user.id, {});
          },
        },
      },
    },
    telemetry: { enabled: false },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;
