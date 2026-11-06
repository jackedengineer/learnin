# ADR-0002: Database design conventions

**Status:** Accepted
**Date:** 2026-11-06
**Deciders:** jackedengineer (owner)

## Context

Neon Postgres (Singapore, accessed from Workers through Hyperdrive) is the system of record. Qdrant is a derived vector index (ARCHITECTURE §3). Better Auth owns four auth tables. The schema will grow through many phases (chunks, conversations, study items, usage), and every row belongs to exactly one user. We need conventions that keep tenant isolation, migrations and future features predictable.

## Decision

**Postgres, managed with Drizzle ORM and committed SQL migrations, using these conventions:**

| Concern | Convention |
|---|---|
| Naming | `snake_case`. **Plural** table names (`notebooks`, `sources`). FK columns `<singular>_id`. Indexes `<table>_<cols>_idx`, uniques `<table>_<cols>_key` |
| Primary keys | `id uuid PRIMARY KEY`, **UUIDv7 generated in the application** (time-ordered → good B-tree locality, no extra round trip, safe to expose). Better Auth is configured to generate UUIDv7 too |
| Tenancy | Every user-owned table has `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`, even when derivable through a parent. Indexes that serve user queries **start with `user_id`**. Every query in the repository layer takes `userId` as a required argument. **RLS** policies arrive in Phase 6 as defense in depth |
| Timestamps | `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` (maintained by the app on update). Always `timestamptz`, stored in UTC |
| Deletion | User-facing aggregates (`notebooks`, `sources`) are **soft-deleted** with `deleted_at timestamptz`. All reads filter `deleted_at IS NULL`. A purge workflow (Phase 1) hard-deletes after cleaning up R2 and Qdrant. Children cascade on hard delete |
| Enums | Postgres enums for small, stable state machines (`source_status`). Values are only ever **added**. Free-form categories use `text` + `CHECK` |
| JSON | `jsonb` only for flexible, non-queried data (`metadata`, `locator`). Anything filtered or joined on gets a real column |
| Constraints | Prefer the database to enforce invariants: `NOT NULL`, `CHECK` (lengths, positive sizes), FKs, partial unique indexes (`WHERE deleted_at IS NULL`) |
| Money | Integer **micro-USD** (`bigint`), never floats |
| Text limits | Titles ≤ 200 chars, enforced by both a `CHECK` and the Zod schema |
| Migrations | `drizzle-kit generate` → reviewed SQL in `packages/db/migrations`, committed, applied by `drizzle-kit migrate` in CI/deploy. **Never edit an applied migration.** Breaking changes use **expand → migrate → contract** across separate deploys. `drizzle-kit check` runs in CI |
| Environments | Local Postgres 16 for development and tests; **Neon branches** for previews/CI; Neon `main` branch for prod |
| Connections | Workers → **Hyperdrive** → Neon via `postgres` (postgres.js), one client per request (Hyperdrive pools). Transactions only where an invariant spans rows |
| Derived stores | Qdrant (and later caches) hold **nothing that can't be rebuilt** from Postgres + R2. Point id = chunk id (ARCHITECTURE §3.4) |

## Options Considered

### Option A: Drizzle + SQL migrations (chosen)
| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Cost | None |
| Scalability | Good |
| Team familiarity | Medium–High (SQL-first, TypeScript types) |

**Pros:** SQL-shaped queries with full types; migrations are plain SQL you can read; runs on Workers; Better Auth has a first-party adapter.
**Cons:** less "magic" than Prisma (relations are explicit); the migration generator occasionally needs hand edits.

### Option B: Prisma
**Pros:** mature, great DX for relations. **Cons:** a heavier runtime and query engine on Workers, less control over SQL, generated client step.

### Option C: Raw SQL (postgres.js only)
**Pros:** zero abstraction. **Cons:** no schema-derived types; migrations and types drift.

### Ids: UUIDv7 (chosen) vs `bigserial` vs UUIDv4
`bigserial` leaks counts and needs a DB round trip to know the id (which hurts idempotent, multi-store writes). v4 fragments indexes. **v7** gives ordering + opacity + client-side generation.

## Trade-off Analysis

The main tension is safety vs. velocity. Denormalized `user_id`, soft deletes and DB constraints add a little ceremony to every table, but they make tenant isolation, recovery from mistakes and multi-store consistency (Postgres ↔ Qdrant ↔ R2) tractable for a solo developer.

## Consequences

- Easier: tenant-scoped queries, auditing, undo/restore, rebuilding Qdrant, RLS later.
- Harder: every read must remember `deleted_at IS NULL`. Repository helpers encapsulate this, so ad-hoc queries are discouraged.
- Revisit: partitioning `chunks` by `user_id` at scale; moving `updated_at` maintenance into a trigger if raw SQL writes appear.

## Action Items

1. [x] `packages/db`: schema for auth tables, `learner_profiles`, `notebooks`, `uploads`, `sources`, `idempotency_keys`; initial migration
2. [x] Repository helpers that require `userId` and apply soft-delete filters
3. [ ] RLS policies (Phase 6)
4. [ ] Purge workflow for soft-deleted aggregates (Phase 1)
