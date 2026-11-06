# Contributing to Doubtless

## Setup

```bash
corepack enable && pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # fill in values
pnpm db:migrate                                     # needs DATABASE_URL (local Postgres 16)
pnpm dev                                            # api on :8787, web on :5173
```

## Workflow (ADR-0003)

- Branch from `main`: `feat/<scope>-<desc>`, `fix/…`, `chore/…`, `docs/…`. Merge within a few days.
- **Conventional Commits:** `type(scope): summary`
  - types: `feat fix docs refactor test chore ci perf build`
  - scopes: `api web mobile db schemas client pipelines infra docs evals`
- **Atomic commits:** one logical slice each, tests green, refactors separate from features.
- **Before every commit:**
  ```bash
  git diff --staged
  git diff --staged -i -G'password|secret|api_key|token' --name-only   # any output → review
  pnpm lint && pnpm typecheck && pnpm test
  ```
- Open a PR using the template and rebase-merge once CI is green. User-visible changes get a `CHANGELOG.md` entry in the same PR.

## Conventions

- API: [ADR-0001](docs/adr/0001-api-conventions.md)
- Database: [ADR-0002](docs/adr/0002-database-design.md)
- Git and CI: [ADR-0003](docs/adr/0003-git-workflow.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Secrets

Never commit secrets. Local: `apps/api/.dev.vars` (git-ignored). Production: `wrangler secret put`. CI: GitHub Actions secrets.
