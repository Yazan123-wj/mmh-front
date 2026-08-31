# 1Epin test-mode integration

This phase talks only to `https://www.1epin.com/api/test/`. Live mode is hard-locked in server code. The MMH storefront still never auto-sends customer orders to 1Epin because payment is a demo.

## Architecture

- `MockSupplierProvider` remains the default (`SUPPLIER_MODE=mock`) so storefront behavior is unchanged until credentials exist.
- `OneEpinClient` is a server-only POST JSON client with Zod validation, timeouts, redaction, and correlation IDs.
- `OneEpinProvider` adapts that client to the existing `SupplierProvider` interface.
- Sync, mapping, callbacks, and test orders live under `src/server/suppliers/1epin/`.

## Environment

See `.env.example`. Credentials exist only in process environment:

- `ONEEPIN_MODE=test`
- `ONEEPIN_TEST_BASE_URL=https://www.1epin.com/api/test/`
- `ONEEPIN_EMAIL` / `ONEEPIN_PASSWORD` — never stored in PostgreSQL
- `ONEEPIN_CALLBACK_TOKEN` — 16+ characters, used in the callback path
- `ONEEPIN_RECONCILE_TOKEN` — Bearer token for the scheduler endpoint
- `ONEEPIN_ALLOW_LIVE=false` — must stay false
- `ONEEPIN_SYNC_ENABLED=false` — reserved; admin actions still run explicitly

The admin UI shows **Configured** or **Not configured** only.

## Live lock

The server rejects:

- `ONEEPIN_MODE=live`
- `ONEEPIN_ALLOW_LIVE=true`
- `SUPPLIER_MODE=live`
- any non-HTTPS URL
- any host other than `www.1epin.com`
- any path other than `/api/test/`

Message:

`1Epin live mode is disabled. Complete payment integration, static-IP setup and production approval first.`

There is no admin switch that can bypass this.

## Static IP

1Epin requires a **static egress IP** on their API Settings page. Result code `02` means the current outbound IP is not allowlisted. Serverless hosts without a fixed NAT are not sufficient for live or reliable test access.

## Endpoint mapping

| 1Epin | Method | Internal |
| --- | --- | --- |
| `checkBalance/` | POST | `client.checkBalance` |
| `categories/` | POST | `client.categories` |
| `categoryInfo/` | POST | `client.categoryInfo` |
| `categoryDetail/` | POST | `client.categoryDetail` |
| `products/` | POST | `client.products` |
| `allProducts/` | POST | `client.allProducts` |
| `addOrder/` | POST | `client.addOrder` — **no blind retry** |
| `checkOrder/` | POST | `client.checkOrder` |
| `localStocks/` | POST | `client.localStocks` (read-only) |
| `addOrderLocal/` / `checkOrderLocal/` | disabled | explicit capability flag only |

`barem` is sent only when the test console provides it. Standard products omit it.

## Result codes

Documented codes `00`–`17` have admin messages, customer-safe messages, retry flags, and recommended actions in `error-map.ts`. Code `07` (registered order number) always reconciles via `checkOrder` using the **same** order number.

## Synchronization

Full sync:

1. `categoryInfo` + `categoryDetail` (HTML sanitized)
2. `allProducts`
3. Upsert supplier category/product mapping rows
4. Never auto-publish
5. Never delete MMH products
6. Missing supplier SKUs are marked `needsReview` / unavailable
7. Manual price overrides are never overwritten

New supplier products stay **Unmapped / Needs review** until an admin maps or drafts them.

## Mapping and pricing

Admins can map to an existing variant, create a **draft** MMH product, ignore, or unmap. Suggested JOD prices use integer fils and current markup rules. Supplier amounts in other currencies stay Decimal + currency until a `CurrencyRate` exists.

## Test orders

`/admin/integrations/1epin/test` is SUPER_ADMIN only. Orders are flagged `isTest`, use `TEP-` supplier refs, and never attach to real customer accounts. PINs are encrypted immediately and masked in the UI. Reveal uses the existing audited reveal action.

Storefront checkout still creates `PENDING` customer orders and does **not** call `addOrder`.

## Callbacks

URL:

`https://<host>/api/integrations/1epin/callback/<ONEEPIN_CALLBACK_TOKEN>`

Configure that URL on the 1Epin API Settings page.

The documented callback has **no cryptographic signature**. The token in the path is compared in constant time. PIN codes and amounts in the callback are **not trusted**. After accept, the server calls `checkOrder` and applies verified state. Duplicate payloads return `OK` without re-applying. Conflicting payloads are stored for review. The HTTP body on success is exactly `OK`.

No IP allowlist is invented. Add one only if 1Epin publishes official callback IPs.

## Reconciliation fallback

Callbacks can be missed. Use:

- Admin “Reconcile processing orders”
- `POST /api/integrations/1epin/reconcile` with `Authorization: Bearer <ONEEPIN_RECONCILE_TOKEN>`

Bounded batches and a short claim lock prevent two workers from handling the same supplier order. Do not run a timer inside Next.js.

Status map: supplier `0` PROCESSING, `1` COMPLETED, `2` FAILED.

Completed ePIN: encrypt PINs, skip customer fulfillment if the order is not `PAID` (except isolated test orders). Failures go to manual review. No automatic refunds.

## Encrypted PINs

AES-256-GCM via the existing code service. Fingerprints prevent duplicate inserts. Test PINs are `isTest` and must not appear in customer accounts.

## Logs

`/admin/integrations/1epin/logs` stores endpoint, correlation ID, result code, duration, and a safe message. Passwords, PIN lists, and tokens are redacted.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Result `02` | Outbound IP is not allowlisted |
| Result `03` | Bad email/password in env |
| Result `04` | Wallet empty |
| Result `10` | 23:45–00:00 supplier agreement window |
| Timeouts on addOrder | Order marked UNKNOWN, then checkOrder |

## Test-to-live checklist (not enabled)

- [ ] Payment webhook marks orders `PAID` before any live `addOrder`
- [ ] Static egress IP allowlisted
- [ ] Production `ONEEPIN_EMAIL` / password in secrets manager
- [ ] Callback HTTPS URL + long token
- [ ] S3 media (not local disk) if serverless
- [ ] Explicit production approval to set `ONEEPIN_ALLOW_LIVE` (code change still required)

Do not claim live readiness.
