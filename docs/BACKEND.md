# MMH commerce backend

This repository is a single Next.js 16 app. The public MMH storefront stays on the approved navy/purple/yellow theme. The Clicks Digitals admin lives at `/admin` and must never leak into public pages.

Local URLs:

- Storefront: `http://localhost:3001`
- Admin login: `http://localhost:3001/admin/login`
- Admin dashboard: `http://localhost:3001/admin`

Port **3001** is required. Do not use 3000.

## Environment

Copy `.env.example` to `.env` and fill in local values. Never commit `.env`.

Required for local development:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_URL` — `http://localhost:3001`
- `CODE_ENCRYPTION_KEY` — 64 hex characters (`openssl rand -hex 32`)
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD` — at least 12 characters, upper, lower, number, symbol

Optional:

- `STORAGE_DRIVER=local` (default). `s3` is a production placeholder and will refuse uploads until S3 env vars are set.
- `SUPPLIER_MODE=mock` — keep this so storefront checkout never auto-sends orders to 1Epin.
- 1Epin **test** client variables: see `docs/ONEEPIN.md` and `.env.example`. Live mode is hard-locked.

Do not put supplier passwords, payment secrets, or encryption keys in the database or documentation.

## Database setup

PostgreSQL 16 is required.

If Docker is available:

```bash
docker compose up -d
```

The compose file creates database `mmh_development` with a local-only development password. Do not reuse it in production.

If Docker is not available, create the database on a local Postgres instance:

```bash
createdb mmh_development
```

Then set `DATABASE_URL` for your OS user, for example:

```text
postgresql://YOUR_USER@localhost:5432/mmh_development
```

## Migrations

```bash
npx prisma generate
npx prisma migrate dev
```

Initial migration name: `20260831144210_init_mmh_commerce`.

Timestamps are stored in UTC. JOD amounts are integer fils (`amountFils`, `priceFils`, `compareAtPriceFils`). 1 JOD = 1,000 fils.

## Seed

```bash
npx prisma db seed
```

The seed is idempotent. It creates:

- Permission rows and role mappings
- One `SUPER_ADMIN` from `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`
- Digital categories, platforms, regions
- The existing 16 MMH catalog products and variants
- Sample banners
- Sample customer and orders (paid/completed, processing, failed, pending)
- Mock 1Epin supplier connection (no credentials)

There is no hardcoded default admin password.

## Admin bootstrap

1. Set the bootstrap env vars.
2. Run the seed.
3. Open `http://localhost:3001/admin/login`.
4. Sign in with the bootstrap email and password.

Public admin registration does not exist. Additional admins are created from `/admin/administrators` by an authorized admin.

## Roles and permissions

All checks run on the server (layout, pages, Route Handlers, and Server Actions). Middleware/proxy is only a first redirect.

| Role | Notes |
| --- | --- |
| SUPER_ADMIN | All permissions, including fulfilling an unpaid order with an audit reason |
| ADMIN | All except unpaid fulfillment |
| CATALOG_MANAGER | Catalog, media, some content |
| ORDER_MANAGER | Orders, customers, code reveal |
| CONTENT_MANAGER | Banners, content, media |
| SUPPORT_AGENT | Read orders/customers; no code reveal |
| VIEWER | Read-only |

Digital codes are encrypted with AES-256-GCM. List endpoints and admin tables show only masked values. Reveal is a separate authorized action and is audit-logged. Support and viewer cannot reveal codes.

## Media storage

`StorageProvider` abstraction:

- Development: local files under `STORAGE_LOCAL_DIR` (default `storage/uploads`), served at `/api/media/[name]`
- Production placeholder: S3-compatible driver; throws until configured

Filenames are generated server-side. Client filenames are not trusted. Images are validated for MIME type, extension, size, and (when readable) dimensions. Binary image data is not stored in PostgreSQL.

Local runtime disk is **not** appropriate for serverless production. Configure object storage before deploying to a serverless host.

## Backup and restore

```bash
pg_dump "$DATABASE_URL" > mmh_backup.sql
psql "$DATABASE_URL" < mmh_backup.sql
```

Media files in `storage/uploads` must be backed up separately in development. In production, back up the object bucket.

Rotate `CODE_ENCRYPTION_KEY` only with a planned re-encryption job. Losing the key makes stored demo/live codes unreadable.

## Supplier adapters

`src/server/suppliers/provider.ts` defines `SupplierProvider`.

- `MockSupplierProvider` — used now
- `OneEpinProvider` — throws “integration is not enabled”
- Factory reads `SUPPLIER_MODE`

This phase does **not**:

- Call `https://www.1epin.com/api/document.html`
- Store supplier credentials in the database
- Send live orders
- Generate or reveal real PIN codes

Admin UI at `/admin/integrations/1epin` is Mock Mode only. It shows credential/callback/static-IP as Yes/No flags, never secret values.

### Future live 1Epin requirements

See `docs/ONEEPIN.md`. Live access is **disabled in this phase**. It will require payment webhooks, a static egress IP, production credentials, and an explicit code-level unlock. Do not set `SUPPLIER_MODE=live` or `ONEEPIN_ALLOW_LIVE=true`.

## Deployment requirements

- Node.js 20+
- PostgreSQL 16
- `AUTH_SECRET`, `AUTH_URL`, `CODE_ENCRYPTION_KEY`
- HTTPS in production (secure cookies)
- Object storage for media
- Static egress IP before live 1Epin
- Do not deploy with `SUPPLIER_MODE=live` in this phase

## Production-readiness checklist

- [ ] Production `DATABASE_URL` (not the compose password)
- [ ] Unique `AUTH_SECRET` and `CODE_ENCRYPTION_KEY`
- [ ] S3-compatible storage configured
- [ ] Backups for Postgres and media
- [ ] Payment provider (orders stay `PENDING` until a verified webhook)
- [ ] Static IP + 1Epin credentials for the next integration phase
- [ ] Review RBAC assignments
- [ ] Confirm MMH storefront theme is unchanged

## Commands

```bash
npm run dev          # next dev -p 3001
npm run lint
npm run typecheck
npm test
npm run build
npm start            # next start -p 3001
```
