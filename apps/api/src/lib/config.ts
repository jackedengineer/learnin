import { z } from "zod";

/** Validate env at the boundary (once per request; cheap). Fails closed. */
const ConfigSchema = z
  .object({
    ENVIRONMENT: z.enum(["development", "test", "production"]),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be ≥ 32 chars"),
    TRUSTED_ORIGINS: z.string().default(""),
    GOOGLE_CLIENT_ID: z.string().default(""),
    GOOGLE_CLIENT_SECRET: z.string().default(""),
    ALLOW_DEV_LOGIN: z.enum(["true", "false"]).default("false"),
    ALLOWED_EMAILS: z.string().default(""),
    UPLOAD_MODE: z.enum(["worker", "presigned"]).default("worker"),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().default("doubtless-uploads"),
  })
  .superRefine((c, ctx) => {
    if (c.ENVIRONMENT === "production" && c.ALLOW_DEV_LOGIN === "true") {
      ctx.addIssue({ code: "custom", message: "ALLOW_DEV_LOGIN must be false in production" });
    }
    if (
      c.ALLOW_DEV_LOGIN === "true" &&
      !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(c.BETTER_AUTH_URL)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "ALLOW_DEV_LOGIN is only allowed for a localhost BETTER_AUTH_URL",
      });
    }
    if (c.ENVIRONMENT === "production" && (!c.GOOGLE_CLIENT_ID || !c.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: "custom",
        message: "Google OAuth credentials are required in production",
      });
    }
    if (
      c.UPLOAD_MODE === "presigned" &&
      !(c.R2_ACCOUNT_ID && c.R2_ACCESS_KEY_ID && c.R2_SECRET_ACCESS_KEY)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "R2 S3 credentials are required for presigned uploads",
      });
    }
  });

export type Config = {
  environment: "development" | "test" | "production";
  baseUrl: string;
  authSecret: string;
  trustedOrigins: string[];
  google: { clientId: string; clientSecret: string } | null;
  devLogin: boolean;
  allowedEmails: Set<string> | null;
  uploadMode: "worker" | "presigned";
  r2: { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string } | null;
};

export function parseConfig(env: Record<string, unknown>): Config {
  const c = ConfigSchema.parse(env);
  const list = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const emails = list(c.ALLOWED_EMAILS).map((e) => e.toLowerCase());
  return {
    environment: c.ENVIRONMENT,
    baseUrl: c.BETTER_AUTH_URL,
    authSecret: c.BETTER_AUTH_SECRET,
    trustedOrigins: list(c.TRUSTED_ORIGINS),
    google:
      c.GOOGLE_CLIENT_ID && c.GOOGLE_CLIENT_SECRET
        ? { clientId: c.GOOGLE_CLIENT_ID, clientSecret: c.GOOGLE_CLIENT_SECRET }
        : null,
    devLogin: c.ALLOW_DEV_LOGIN === "true",
    allowedEmails: emails.length ? new Set(emails) : null,
    uploadMode: c.UPLOAD_MODE,
    r2:
      c.R2_ACCOUNT_ID && c.R2_ACCESS_KEY_ID && c.R2_SECRET_ACCESS_KEY
        ? {
            accountId: c.R2_ACCOUNT_ID,
            accessKeyId: c.R2_ACCESS_KEY_ID,
            secretAccessKey: c.R2_SECRET_ACCESS_KEY,
            bucket: c.R2_BUCKET_NAME,
          }
        : null,
  };
}
