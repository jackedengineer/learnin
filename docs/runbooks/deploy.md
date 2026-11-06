# Runbook: first production deploy and routine deploys

Production deploys run from `main` through [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml). This runbook covers the **one-time setup** and the **break-glass** procedures.

Region: **Singapore** for everything stateful (ARCHITECTURE §12.1).

## 1. Neon (Postgres)

1. Create the project **`doubtless`** in **AWS Asia Pacific (Singapore) `ap-southeast-1`**, Postgres 16+.
2. Copy two connection strings for the `main` branch, database `neondb` (or create `doubtless`):
   - **Direct** (no `-pooler` in the host): used for migrations → GitHub secret `NEON_DATABASE_URL`.
   - Direct is also what Hyperdrive should point at. Hyperdrive does its own pooling.
3. Optional: enable a **minimum compute** if cold starts hurt chat latency later.

## 2. Cloudflare

Run these from `apps/api`, authenticated with `npx wrangler login` or `CLOUDFLARE_API_TOKEN`.

```bash
npx wrangler r2 bucket create doubtless-uploads --location apac
```

```bash
npx wrangler hyperdrive create doubtless-neon --connection-string="<NEON DIRECT URL>"
```

Put the returned Hyperdrive **id** into `apps/api/wrangler.jsonc` → `env.production.hyperdrive[0].id`. It isn't secret, so commit it. The deploy workflow refuses the all-zero placeholder.

R2 presigned uploads need an S3 API token:
1. In the dashboard, go to R2 → Manage API tokens.
2. Create an **Object Read & Write** token scoped to `doubtless-uploads`.
3. Set the bucket's **CORS policy** to allow `PUT` from `https://doubtless.app` with header `content-type`.

Worker secrets:

```bash
npx wrangler secret put BETTER_AUTH_SECRET --env production     # openssl rand -base64 32
```

```bash
npx wrangler secret put GOOGLE_CLIENT_ID --env production
```

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
```

```bash
npx wrangler secret put R2_ACCOUNT_ID --env production
```

```bash
npx wrangler secret put R2_ACCESS_KEY_ID --env production
```

```bash
npx wrangler secret put R2_SECRET_ACCESS_KEY --env production
```

Custom domain: attach `doubtless.app` to the `doubtless-api` Worker (Workers → Settings → Domains & Routes). If you use a different domain, update `BETTER_AUTH_URL` and `TRUSTED_ORIGINS` under `env.production.vars`.

## 3. Google OAuth (Google Cloud Console)

1. **APIs & Services → OAuth consent screen**: External, app name **Doubtless**, scopes `openid`, `email`, `profile` only. While testing, add your Google account under *Test users*.
2. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://doubtless.app`, `http://localhost:5173`
   - Authorized redirect URIs: `https://doubtless.app/v1/auth/callback/google`, `http://localhost:5173/v1/auth/callback/google`
3. Copy the client ID and secret into `wrangler secret put` (above) and into `apps/api/.dev.vars` for local testing.
4. Mobile (Phase 4) adds iOS and Android client IDs.

Personal phase: set `ALLOWED_EMAILS` (comma-separated) in `env.production.vars` so only you can create an account.

## 4. GitHub

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with *Workers Scripts: Edit*, *Workers R2 Storage: Edit*, *Hyperdrive: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | your account id |
| `NEON_DATABASE_URL` | Neon **direct** connection string |

- Create a GitHub **environment** named `production`, then:
  - Set *Deployment branches* to **`main` only**.
  - Add yourself as a **required reviewer**.
  - Store the three secrets above as **environment secrets** (not repository secrets), so only approved `production` jobs can read them.
  - The deploy workflow also refuses anything other than a green `push` CI run of this repository's `main`.
- Enable **branch protection** on `main`: require the `CI` checks and linear history (ADR-0003).

## 5. Routine deploy

Merge to `main` → CI passes → the Deploy workflow runs these steps in order:
1. Build the web assets.
2. Apply the migrations (expand-only).
3. `wrangler deploy --env production`.
4. Health check `GET /v1/health?deep=1`.

## Break-glass

**Roll back the Worker:**

```bash
cd apps/api && npx wrangler deployments list --env production
```

```bash
cd apps/api && npx wrangler rollback <deployment-id> --env production
```

Migrations are expand-only (ADR-0002), so the previous Worker version still works against the newer schema.

**Bad migration:** write a forward-fix migration. Never edit an applied migration. Neon point-in-time restore is the last resort: branch from a timestamp, verify, promote.

**Revoke all sessions:**

```sql
DELETE FROM sessions;
```

Cached session cookies expire within 5 minutes. Rotate `BETTER_AUTH_SECRET` to invalidate them immediately.
