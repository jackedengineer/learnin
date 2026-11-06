# Doubtless

Ask your study doubts and get precise answers grounded in **your own sources**: PDFs, papers, lecture recordings, transcripts, images, web pages and notes. Every answer cites the exact page, passage or video moment it came from.

- **Plain-language overview and user journeys:** [docs/OVERVIEW.md](docs/OVERVIEW.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Decisions:** [docs/adr/](docs/adr/) (API conventions, database design, git workflow)
- **Competitor research:** [hands-on results](docs/research/notebooklm-hands-on-results.md)

## Status

**Phase 0 (skeleton): done.**
- Google sign-in
- Onboarding
- Notebooks
- Adding sources by upload, link or pasted text
- Typed REST API with OpenAPI
- CI

**Phase 1 (text RAG with citations): next.** See ARCHITECTURE §13.

## Stack

| Layer | Tech |
|---|---|
| Web | Vite + React 19, TanStack Router + Query, Tailwind v4 |
| Mobile | Expo (Phase 4) |
| API | Hono on Cloudflare Workers, `@hono/zod-openapi`, typed `hc` client |
| Auth | Better Auth, Google only |
| Data | Neon Postgres (Singapore) via Hyperdrive + Drizzle; R2 for files; Qdrant (Phase 1) |
| AI | Claude (Haiku / Sonnet / Opus 5.5 router), Voyage embeddings + rerank (Phase 1) |

## Repository layout

```
apps/api          Hono Worker (REST + auth), serves the web build as static assets
apps/web          React SPA
packages/db       Drizzle schema, migrations, tenant-scoped repositories
packages/schemas  Zod request/response schemas (the API contract)
packages/api-client  Typed client shared by web and mobile
docs/             Architecture, ADRs, research, runbooks
```

## Local development

Requirements: Node 22, pnpm 10, Postgres 16 on `localhost:5432`.

```bash
corepack enable && pnpm install
```

```bash
createdb doubtless && createdb doubtless_test   # role doubtless/doubtless, see CONTRIBUTING
```

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars   # set BETTER_AUTH_SECRET (openssl rand -base64 32)
```

```bash
pnpm db:migrate
```

```bash
pnpm dev   # API → http://localhost:8787, web → http://localhost:5173
```

Without Google credentials, use the **dev login** on the sign-in page. It's enabled only in local development, and the server refuses to start with it in production.

## Quality gates

```bash
pnpm check   # lint + typecheck + unit/integration tests + migration check
```

```bash
pnpm e2e     # browser smoke test (needs `pnpm dev` running)
```

CI runs the same gates plus the browser smoke test on every push ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Deploying is covered in [docs/runbooks/deploy.md](docs/runbooks/deploy.md).
