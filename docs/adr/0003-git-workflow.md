# ADR-0003: Git workflow and CI gates

**Status:** Accepted
**Date:** 2026-11-06
**Deciders:** jackedengineer (owner)

## Context

One human developer plus AI coding sessions work on a pnpm/Turborepo monorepo that deploys to Cloudflare. AI sessions push to designated `claude/*` branches. We want a history that's easy to read, every change verified before it reaches `main`, and deploys that follow mechanically from `main`.

## Decision

**Trunk-based development with short-lived branches, squash-merged PRs, Conventional Commits, and CI as the merge gate.**

| Concern | Convention |
|---|---|
| Trunk | `main` is always deployable and protected: no direct pushes, CI must pass, linear history |
| Branches | Short-lived (≤ a few days): `feat/<scope>-<desc>`, `fix/…`, `chore/…`, `docs/…`. AI sessions use their assigned `claude/<name>` branch |
| Commits | **Conventional Commits**: `type(scope): summary`. Types: `feat fix docs refactor test chore ci perf build`. Scopes: `api web mobile db schemas client pipelines infra docs evals`. Imperative, ≤ 72-char subject, a body explaining *why* |
| Commit size | **Atomic commits**, one logical slice each (~100–300 lines), each leaving tests green. Refactors, formatting and features go in separate commits. Before every commit: review `git diff --staged`, run the secret scan (`git diff --staged -i -G'password\|secret\|api_key\|token' --name-only`), tests, lint and typecheck |
| PRs | One feature per PR, using the template in `.github/pull_request_template.md` (what, why, how tested, migrations, screenshots, change summary including what was deliberately *not* touched). **Rebase-merge**: keeps the atomic commits and a linear history. Squash only when a branch's commits are noisy |
| Versioning | The API is versioned by path (ADR-0001). Apps are continuously deployed from `main`, and mobile releases get SemVer tags (`mobile-v1.2.0`). `CHANGELOG.md` gets a human-readable entry (Added / Changed / Fixed / Security) in the same PR as any user-visible change |
| Breaking changes | `feat(api)!:` or a `BREAKING CHANGE:` footer. API breaking changes also need a new version path (ADR-0001) |
| CI gates (every push/PR) | `pnpm install --frozen-lockfile` → **format + lint** (Biome) → **typecheck** (all packages) → **unit + integration tests** (Vitest against a real Postgres service container) → **migration check** (`drizzle-kit check`) → **build** (web + api bundle) |
| Later gates | OpenAPI diff (Phase 1), retrieval evals (Phase 1), Neon preview branch + preview deploy per PR (Phase 2) |
| Deploys | Merge to `main` → CI → apply migrations → `wrangler deploy`. No manual prod deploys except a documented break-glass procedure |
| Secrets | Never committed. `.dev.vars` (git-ignored) locally, `wrangler secret` in prod, GitHub Actions secrets for CI |
| Dependencies | Lockfile committed, exact versions for runtime-critical packages, Renovate-style weekly batches (later) |

## Options Considered

### Option A: Trunk-based + atomic commits, rebase-merge (chosen)
| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Cost | None |
| Scalability | Good up to small teams |
| Team familiarity | High |

**Pros:** simple, linear history, every `main` commit is deployable, pairs naturally with CD.
**Cons:** relies on CI quality, since there's no release branch to catch problems.

### Option B: GitFlow (develop/release/hotfix branches)
**Pros:** explicit release staging. **Cons:** heavy ceremony for one developer with continuous deploys; long-lived branches drift.

### Option C: Commit directly to main
**Pros:** fastest. **Cons:** no review point for AI-generated changes, no CI gate before deploy.

## Trade-off Analysis

AI sessions produce sizeable diffs quickly. A PR is the natural checkpoint where CI and human review happen, so Option C is out. GitFlow adds process without benefit at this team size. Trunk-based with strong CI gives a review point and a fast path to production.

## Consequences

- Easier: reading history, bisecting (atomic commits), changelogs, rollbacks (revert a commit or a PR's range).
- Harder: large features must be split into small, independently shippable PRs, or hidden behind flags.
- Revisit: add a changelog/release tool once there are external users; add preview environments in Phase 2.

## Action Items

1. [x] `.github/workflows/ci.yml` with the gates above
2. [x] `.github/pull_request_template.md`, `CONTRIBUTING.md`
3. [ ] Enable branch protection on `main` in GitHub settings (owner action)
