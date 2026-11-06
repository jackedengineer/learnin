import { createApiClient } from "@doubtless/api-client";

/** Same-origin in dev (Vite proxy) and prod (Workers static assets). */
export const api = createApiClient(window.location.origin);
