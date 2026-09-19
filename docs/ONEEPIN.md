# OneEpin (Django)

Authoritative implementation: **`backend/suppliers/`**.

```text
Frontend → Django REST → suppliers app → OneEpin (test/mock only)
```

Live purchasing is hard-locked. Default `SUPPLIER_MODE=mock`.

## Endpoints

Storefront callbacks (token-gated):

- `POST /api/v1/suppliers/1epin/callback/<token>/`
- `POST /api/v1/suppliers/1epin/reconcile/`

Admin (JWT + admin permissions):

- `GET /api/v1/admin/1epin/status/`
- `POST /api/v1/admin/1epin/ping/`
- `GET /api/v1/admin/1epin/balance/`
- `POST /api/v1/admin/1epin/sync/`
- `GET /api/v1/admin/1epin/logs/`

## Env (backend only)

See `backend/.env.example`. Never put OneEpin credentials in `NEXT_PUBLIC_*`.

## Removed

The previous TypeScript OneEpin client under `frontend/src/server/suppliers/1epin/` and Next routes `/api/integrations/1epin/*` were removed after verifying Django replaces them.
