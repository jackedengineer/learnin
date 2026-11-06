import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { DbFactory } from "./lib/context.ts";
import { requestContext, requireSession, services } from "./lib/middleware.ts";
import { createRouter } from "./lib/openapi.ts";
import { ApiError, problemResponse } from "./lib/problem.ts";
import { meRouter } from "./routes/me.ts";
import { notebooksRouter } from "./routes/notebooks.ts";
import { sourcesRouter } from "./routes/sources.ts";
import { uploadContentRouter, uploadsRouter } from "./routes/uploads.ts";

const PUBLIC_PREFIXES = ["/v1/auth/", "/v1/health", "/v1/openapi.json"];
const JSON_BODY_LIMIT = 2 * 1024 * 1024; // pasted text ≤ 500k chars

const health = createRoute({
  method: "get",
  path: "/v1/health",
  tags: ["Meta"],
  summary: "Liveness; `?deep=1` also checks the database",
  request: { query: z.object({ deep: z.enum(["0", "1"]).optional() }) },
  responses: {
    200: {
      description: "Healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("ok"),
            environment: z.string(),
            db: z.enum(["ok", "skipped"]),
          }),
        },
      },
    },
  },
});

export function createApp(deps: { dbFactory?: DbFactory } = {}) {
  const app = createRouter();

  app.use("*", requestContext);
  app.use("/v1/*", services(deps.dbFactory));
  app.use("/v1/*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (/^\/v1\/uploads\/[^/]+\/content$/.test(path)) return next(); // raw streamed body
    return bodyLimit({
      maxSize: JSON_BODY_LIMIT,
      onError: () => {
        throw new ApiError(413, "request.too_large", "Request body too large");
      },
    })(c, next);
  });
  app.use("/v1/*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p))) return next();
    return requireSession(c, next);
  });

  // Better Auth owns /v1/auth/* (its responses use Better Auth's error format, not problem+json).
  app.on(["GET", "POST"], "/v1/auth/*", (c) => c.var.auth.handler(c.req.raw));

  const routes = app
    .openapi(health, async (c) => {
      let db: "ok" | "skipped" = "skipped";
      if (c.req.valid("query").deep === "1") {
        await c.var.db.execute(sql`select 1`);
        db = "ok";
      }
      return c.json({ status: "ok" as const, environment: c.var.config.environment, db }, 200);
    })
    .route("/v1/notebooks", notebooksRouter)
    .route("/v1/uploads", uploadsRouter)
    .route("/v1/uploads", uploadContentRouter)
    .route("/v1", sourcesRouter)
    .route("/v1/me", meRouter);

  app.openAPIRegistry.registerComponent("securitySchemes", "session", {
    type: "apiKey",
    in: "cookie",
    name: "doubtless.session_token",
  });
  app.doc31("/v1/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Doubtless API",
      version: "1.0.0",
      description: "Conventions: docs/adr/0001-api-conventions.md",
    },
    security: [{ session: [] }],
  });

  app.notFound((c) => problemResponse(c, new ApiError(404, "route.not_found", "Route not found")));
  app.onError((err, c) => {
    if (err instanceof ApiError) return problemResponse(c, err);
    if (err instanceof HTTPException) {
      const status = err.status as ContentfulStatusCode;
      const code = status === 400 ? "request.malformed" : `http.${status}`;
      return problemResponse(c, new ApiError(status, code, err.message || "Bad request"));
    }
    console.error(
      JSON.stringify({
        level: "error",
        msg: "unhandled_error",
        requestId: c.get("requestId"),
        error:
          err instanceof Error
            ? { name: err.name, message: err.message, stack: err.stack }
            : String(err),
      }),
    );
    return problemResponse(c, new ApiError(500, "internal", "Internal server error"));
  });

  return routes;
}

export type AppType = ReturnType<typeof createApp>;
