import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/v1/auth",
});

/** Local development only: email+password login, refused by the server in production. */
export const devLoginEnabled = import.meta.env.DEV;
