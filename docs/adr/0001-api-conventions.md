# ADR-0001: HTTP API conventions

**Status:** Accepted
**Date:** 2026-11-06
**Deciders:** jackedengineer (owner)

## Context

Doubtless has two first-party clients: the web SPA, and an Expo mobile app whose installed versions lag behind the server for months. Later it will also have webhook callers (ASR providers) and possibly third-party integrations. The API runs on Cloudflare Workers with Hono (see ARCHITECTURE §6.1). We need conventions that keep the API consistent as it grows, give clients end-to-end types, and make breaking changes detectable before they ship to old mobile builds.

## Decision

**REST over JSON, defined in code with `@hono/zod-openapi`, consumed through Hono's typed `hc` client, and versioned by path.**

| Concern | Convention |
|---|---|
| Base path | `/v1`. Breaking changes require `/v2`, and both are served until the minimum supported mobile version passes `/v1` |
| Resources | Plural, kebab-case nouns: `/v1/notebooks/:notebookId/sources`. Nest at most one level. Child resources with global ids also get a top-level path (`/v1/sources/:sourceId`) |
| Actions | Non-CRUD actions are `POST` sub-paths with a verb: `POST /v1/sources/:id/retry`, `POST /v1/uploads/:id/complete` |
| Methods / status | `GET` 200 · `POST` create → **201** + `Location` header + body · `PATCH` partial update → 200 · `DELETE` → **204** · async accept → **202** |
| Payload shape | `camelCase` JSON. Single resources returned bare. Lists use the envelope `{ data: T[], nextCursor: string \| null }` |
| IDs | UUIDv7 strings, generated server-side (time-ordered, and safe to expose) |
| Time | ISO-8601 UTC strings (`2026-11-06T09:00:00.000Z`) |
| Pagination | Cursor-based: `?limit=` (default 20, max 100) and `?cursor=` (opaque base64url of `(createdAt, id)`). No offset pagination |
| Validation | Zod schemas in `packages/schemas` are the single source of truth for request and response shapes and generate OpenAPI. Unknown fields in request bodies are rejected (`strict`) |
| Errors | **RFC 9457 `application/problem+json`**: `{ type, title, status, detail?, code, instance?, errors? }`. `code` is a stable, dot-namespaced, machine-readable string (`notebook.not_found`, `validation.failed`, `auth.required`). `errors[]` carries field-level validation issues `{ path, message }` |
| Ownership | A resource owned by another user returns **404 `*.not_found`**, never 403, so ids can't be enumerated |
| Auth | Session cookie (web) or bearer token (mobile) via Better Auth. Missing or invalid → 401 `auth.required` |
| Idempotency | `Idempotency-Key` header (client-generated once per *intent* and reused on retry) is **supported on all `POST` creates** and required by clients on the retry-prone ones (sources, messages). **Claimed atomically** by inserting into `idempotency_keys` with a unique `(user_id, key)` constraint (never select-then-insert). States: `in_progress` → `completed` (response stored). Same key + same body → replay the stored status and body. Same key + different body → **422 `idempotency.key_reused`**. Duplicate while the first is in flight → **409 `idempotency.in_progress`** (the client retries later). An `in_progress` claim older than a 60 s lease (a crashed request) can be reclaimed. A failed handler releases the claim. Retention 24 h, longer than any client retry path (there's no server-side redelivery of client requests) |
| Naming details | Booleans are `is*`/`has*`. Enum values are lowercase `snake_case` strings (matching the Postgres enums), documented in the OpenAPI spec |
| Rate limits | 429 `rate_limited` with `Retry-After` |
| Tracing | `X-Request-Id` is accepted or generated, echoed on every response, and included in logs and problem `instance` |
| Spec | `GET /v1/openapi.json` is generated from the routes. CI diffs it against `main` (Phase 1+), and breaking diffs fail the build unless they're under a new version |
| Caching | `Cache-Control: no-store` on authenticated JSON by default. Explicit caching is opted into per route |

## Options Considered

### Option A: REST + zod-openapi + `hc` (chosen)
| Dimension | Assessment |
|---|---|
| Complexity | Low–Med |
| Cost | None |
| Scalability | Good: standard HTTP semantics, cacheable, any client can call it |
| Team familiarity | High (REST) |

**Pros:** typed client without a separate contract package; OpenAPI for free; wire-level breaking-change detection; works for webhooks and non-TS clients.
**Cons:** route definitions are more verbose than tRPC; TypeScript inference can slow down with many routes (mitigated by sub-app splitting).

### Option B: tRPC
| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Cost | None |
| Scalability | Good |
| Team familiarity | Medium |

**Pros:** best developer experience, minimal boilerplate.
**Cons:** RPC URLs instead of resources; compile-time types don't protect old mobile builds; OpenAPI is a community add-on; awkward for webhooks.

### Option C: Hand-written REST, no schema layer
**Pros:** zero abstractions. **Cons:** types drift between server, web and mobile; no spec; validation scattered.

## Trade-off Analysis

The deciding forces are **mobile version skew** and **non-TS callers**. Both need wire-level contracts (OpenAPI + diffing), which tRPC can't provide natively. zod-openapi costs a little verbosity per route and returns a spec, validation and a typed client from one definition.

## Consequences

- Easier: adding clients, generating docs, detecting breaking changes, consistent errors in both UIs.
- Harder: every route needs request and response schemas. That's deliberate.
- Revisit: optimistic concurrency (`ETag` / `If-Match`) once notebooks can be shared; streaming chat endpoints (SSE) sit outside the OpenAPI JSON schema and are documented separately (ARCHITECTURE §6.3).

## Action Items

1. [x] `packages/schemas`: shared Zod schemas, problem type, pagination helpers
2. [x] `apps/api`: problem+json error handler, request-id middleware, cursor helpers, idempotency middleware
3. [ ] CI: OpenAPI diff gate (Phase 1)
