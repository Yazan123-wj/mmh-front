# Deployment

MMH deploys as **separate services**. Do not assume a single host runs both Next.js and Django.

## Architecture

```text
Browser
  → Frontend (Next.js-compatible hosting) : public site + admin UI
  → Backend (Python/Django hosting) : REST API :8000 internally
  → Managed PostgreSQL
  → Media: persistent volume OR future S3-compatible storage
```

Payment gateway integration is **owned by another developer**. Infrastructure can go live while **commerce go-live remains blocked**.

See also:

- [PAYMENT_INTEGRATION_HANDOFF.md](./PAYMENT_INTEGRATION_HANDOFF.md)
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- [MEDIA_STORAGE.md](./MEDIA_STORAGE.md)
- [STATIC_FALLBACK.md](./STATIC_FALLBACK.md)

---

## Required environment variables (names)

### Backend

`DJANGO_ENV`, `SECRET_KEY` / `DJANGO_SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`,  
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`,  
`CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,  
`CODE_ENCRYPTION_KEY`, `ALLOW_DEMO_AUTO_PAYMENT`,  
`SUPPLIER_MODE`, `ONEEPIN_*`, `BOOTSTRAP_ADMIN_*` (seed only)

### Frontend

`NEXT_PUBLIC_API_URL`, `API_URL`, `AUTH_SECRET`, `AUTH_URL`,  
`NEXT_PUBLIC_ALLOW_STATIC_CATALOG_FALLBACK` (keep false in production)

Never put secrets in `NEXT_PUBLIC_*`.

---

## Backend deployment steps

1. Install Python 3.12+ deps: `pip install -r backend/requirements.txt`
2. Set production env (`DJANGO_ENV=production`, `DEBUG=false`, strong secrets, DB password, encryption key, CORS/CSRF HTTPS origins).
3. Confirm process **refuses** to start if demo auto-pay or live OneEpin is enabled.
4. Run migrations (never flush/reset production DB):

   ```bash
   python manage.py migrate
   ```

5. Collect static files (WhiteNoise):

   ```bash
   python manage.py collectstatic --noinput
   ```

6. System check:

   ```bash
   python manage.py check --deploy
   ```

7. Health:

   - `GET /health/` or `GET /api/health/` → `{ "status": "ok" }`
   - `GET /api/ready/` → database readiness

8. Admin bootstrap: use explicit `BOOTSTRAP_ADMIN_*` only via controlled seed on non-production, or create staff via Django shell / management with a strong password. **No default production password.**

9. Run via gunicorn/uvicorn (example): `gunicorn config.wsgi:application`

---

## Frontend deployment

1. Set `NEXT_PUBLIC_API_URL` / `API_URL` to the public API base (`…/api/v1`).
2. Set `AUTH_SECRET` and `AUTH_URL` to the public site URL.
3. `NEXT_PUBLIC_ALLOW_STATIC_CATALOG_FALLBACK=false`
4. `npm ci && npm run build && npm start` (or platform equivalent).
5. Ensure image remote patterns resolve from `NEXT_PUBLIC_API_URL` (see `next.config.ts`).

---

## Database

- Configure `POSTGRES_*` for the managed instance (no localhost defaults in production).
- Connection pooling may be provided by the host (PgBouncer); optional `POSTGRES_CONN_MAX_AGE`.
- Always `migrate` forward; never delete migration history on production.

---

## Media

Local filesystem is fine with a **persistent volume**. Ephemeral disks will lose uploads. See [MEDIA_STORAGE.md](./MEDIA_STORAGE.md).

---

## Rollback strategy

1. Redeploy previous frontend/backend artifacts.
2. Database: restore from backup **only** if a migration cannot be reversed safely; prefer forward-fix migrations.
3. Keep `CODE_ENCRYPTION_KEY` identical across rollbacks or encrypted codes become unreadable.

---

## Post-deploy smoke tests

- [ ] `GET /api/health/` → ok
- [ ] `GET /api/ready/` → database ok
- [ ] Storefront loads catalog from API (not stale static prices)
- [ ] Checkout against API fails closed if payment not integrated (pending order, no fake PAID)
- [ ] Admin login via JWT + RBAC
- [ ] `ALLOW_DEMO_AUTO_PAYMENT` is false; demo auto-pay impossible
- [ ] OneEpin live still locked
- [ ] Upload a product image; URL loads from media origin

---

## Rate limiting

App-level distributed rate limits are not bundled. At the reverse proxy / platform, rate-limit:

- `/api/v1/auth/token/`
- registration endpoints
- code reveal
- supplier ping/sync
- code import upload (already capped at 5 MB / 10k rows server-side)

---

## Django built-in admin

`/django-admin/` remains available for operational staff/superuser use. Prefer the Next admin UI + `/api/v1/admin/` for day-to-day. Restrict network access if exposed publicly.
