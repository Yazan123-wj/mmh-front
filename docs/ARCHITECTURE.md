# MMH architecture

## Active data flow

```text
Storefront browser
  → Next.js frontend (:3001)
  → Django REST /api/v1 (:8000)
  → Django services / ORM
  → PostgreSQL

Future Admin Panel
  → Next.js /admin UI
  → Django /api/v1/admin/*
  → PostgreSQL

OneEpin
  ← Django suppliers app only (mock/test; live locked)
```

## What is NOT active

- Prisma / `@prisma/client`
- Next.js direct PostgreSQL access
- Frontend TypeScript OneEpin client (removed)
- Legacy Next routes `/api/integrations/*`, `/api/media/*`, `/api/admin/catalog/export` (removed)

## Static fallback

`frontend/src/data/` (products, categories, etc.) is used only when Django catalog APIs fail. It is not a second database.

## Auth

NextAuth (cookies) + Django SimpleJWT (API). Do not move secrets into `NEXT_PUBLIC_*`.

## Order lifecycle (current)

`PENDING` payment + mock fulfillment codes → `fulfillment COMPLETED` for demos. Real PSP = Phase 3. Live 1Epin = locked.
