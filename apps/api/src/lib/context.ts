import type { Database } from "@doubtless/db";
import type { Auth, AuthSession } from "./auth.ts";
import type { Config } from "./config.ts";

export type Bindings = CloudflareBindings & {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    requestId: string;
    config: Config;
    db: Database;
    auth: Auth;
    user: AuthSession["user"];
    session: AuthSession["session"];
  };
};

/** Injectable DB factory so tests can share one connection. */
export type DbFactory = (env: Bindings) => { db: Database; close: () => Promise<void> };
