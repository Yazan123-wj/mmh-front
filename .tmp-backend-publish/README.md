# MMH Django backend

REST API for the MMH storefront and admin panel.

Repo: https://github.com/Yazan123-wj/mmh-backend

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_catalog   # development only — refused in production
python manage.py runserver 8000
```

## API

Base: `http://localhost:8000/api/v1/`

- Health: `/health/`, `/api/health/`, `/api/ready/`
- Auth: `/auth/register/`, `/auth/token/`, `/auth/me/`
- Catalog: `/catalog/...`
- Checkout: `/checkout/orders/`, `/coupons/validate/`
- Orders: `/orders/mine/`, `/orders/:order_number/`
- Admin: `/admin/...` (JWT + RBAC)
- Supplier: `/suppliers/1epin/...` and `/admin/1epin/...`

## Environment

See `.env.example`. Key production flags:

- `DJANGO_ENV=production` requires strong `SECRET_KEY`, `CODE_ENCRYPTION_KEY` (64 hex chars), DB password, CORS, `DEBUG=false`
- `ALLOW_DEMO_AUTO_PAYMENT` must be false in production
- `ONEEPIN_ALLOW_LIVE` remains false until payment go-live
- Managed Postgres often needs `POSTGRES_SSLMODE=require` (default in production)

Generate encryption key: `openssl rand -hex 32` — back it up; losing it makes stored codes undecryptable.

## Deploy (Render)

1. Connect this repo at [Render Blueprints](https://dashboard.render.com/blueprints) using `render.yaml`.
2. Set `CODE_ENCRYPTION_KEY` (`openssl rand -hex 32`).
3. Set `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` to your frontend URL(s).
4. Deploy. Health check: `/api/health/`.

Docker (any host):

```bash
docker build -t mmh-backend .
docker run -p 8000:8000 --env-file .env mmh-backend
```

Demo customer (dev seed): `demo@mmh.local` / `DemoCustomer1!`  
Supplier mode defaults to `mock`. Live 1Epin is locked.
