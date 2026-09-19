# Static frontend fallback

`frontend/src/data/` holds intentional temporary demo/fallback content.

PostgreSQL via Django is the canonical source of truth. Static data is **not** a second database.

## When it is used

| Area | Files | Behavior |
| --- | --- | --- |
| Catalog resolve | `products.ts`, `categories.ts` via `server/catalog/resolve.ts` | Used when Django catalog APIs fail / are unreachable **and** fallback is allowed |
| Cart UI enrichment | `products.ts` | Client-side product name/image lookup by id |
| Nav / search chrome | `categories.ts`, `navigation.ts`, `products.ts` | Mega menu, mobile menu, search overlay |
| Home marketing tiles | `home.ts`, `brands.ts`, `promotional-banners.ts` | Layout chrome; some product carousels still read `PRODUCTS` |
| FAQ page | `faq.ts` | Page still imports static FAQ; Django `cms/faqs` also exists |
| i18n strings | `translations.ts` | UI copy, not business data |
| Reviews / mock orders | `reviews.ts`, `mock-orders.ts` | Demo-only |

## Production strategy (B — fail closed for catalog truth)

`resolveStorefrontProducts` / categories / product-by-slug:

- **Production (`NODE_ENV=production`)**: static catalog fallback is **disabled** by default.
- Returns empty / undefined when the API is down — storefront shows unavailable state rather than stale prices.
- Override only with `NEXT_PUBLIC_ALLOW_STATIC_CATALOG_FALLBACK=true` (emergency demos — still never treat as purchase truth).

Checkout always calls Django (`createStorefrontOrder` → `/api/v1/checkout/orders/`). A backend outage cannot complete a successful paid order from static data.

## Rule

Changes under `frontend/src/data/` must never be treated as production catalog or order updates. Prefer Django seed / admin APIs for real data.
