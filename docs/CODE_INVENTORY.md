# Digital code inventory & bulk import

This document describes how MMH stores, imports, and counts digital gift-card / voucher codes.

## Lifecycle

Statuses on `DigitalCode`:

| Status | Meaning |
|--------|---------|
| `AVAILABLE` | In inventory, not assigned |
| `RESERVED` | Held for an in-flight order |
| `DELIVERED` | Assigned / revealed to a customer order |
| `UNAVAILABLE` | Deactivated (unused available codes only) |

Sources (`DigitalCode.source`):

- `MANUAL` — single admin create
- `CSV_IMPORT` — bulk CSV/XLSX import
- `ONEEPIN` — reserved for supplier sync (live purchase remains locked)
- `CHECKOUT_DEMO` — local demo fulfillment pins

Admins should not hard-delete reserved/delivered codes. Prefer status transitions.

## Encryption

Every stored code uses the existing AES-GCM helpers in `commerce/crypto.py`:

- `encrypt_code(plaintext)` → ciphertext + nonce + masked display
- `decrypt_code` only via the **reveal** API (`codes.reveal`)

Payload rules:

- Code only → plaintext string encrypted
- Code + PIN → JSON `{"code":"...","pin":"..."}` encrypted as one blob

There are **no** `plain_code` / `raw_code` columns. List/import-history APIs return **masked** values only.

## Fingerprint duplicate detection

Because ciphertext is non-deterministic (AES-GCM), duplicate detection uses:

```text
code_fingerprint = SHA-256( normalize(code) [| pin] )
```

Normalization: strip whitespace, uppercase the code; if a PIN is present it is appended after `|`.

- Fingerprints are **not** reversible to the code
- Lookups use `WHERE code_fingerprint IN (...)` — no decrypting the table
- Unique constraint on `code_fingerprint` (nullable for legacy rows)

## Bulk import flow

1. Admin uploads CSV/XLSX to Django (`POST /api/v1/admin/codes/import/preview/`)
2. Backend parses, validates, masks preview rows, stores the file temporarily under `MEDIA_ROOT/code_imports/`
3. Creates a `CodeImportBatch` (`VALIDATED` or `FAILED`)
4. Admin confirms (`POST /api/v1/admin/codes/import/confirm/`)
5. Valid rows are encrypted + `bulk_create`d; pending file deleted
6. Variant `stock_status` is synced from available code counts
7. Audit: `codes.import.completed` (counts/ids only — never plaintext)

Max upload: **10,000 rows**, **5 MB**.

Batch statuses: `PENDING`, `VALIDATED`, `PROCESSING`, `COMPLETED`, `PARTIAL`, `FAILED`.

Plaintext file contents are **not** kept in import history after confirm.

## CSV / XLSX formats

### Simple (default)

Admin selects product variant, then uploads:

```csv
code,pin
SAMPLE-CODE-001,1234
SAMPLE-CODE-002,
```

`pin` is optional. Column `code` is required.

### Advanced

```csv
sku,code,pin
PSN-10-US,SAMPLE-CODE-001,1234
PSN-20-US,SAMPLE-CODE-002,
```

Or `variant_id,code,pin`. Unsupported columns are rejected.

Templates: `GET /api/v1/admin/codes/import/template/?mode=SIMPLE|ADVANCED`

XLSX uses the same headers (via `openpyxl`).

## Admin UI

| Route | Permission | Purpose |
|-------|------------|---------|
| `/admin/codes/import` | `codes.manage` | Wizard: type → variant → upload → preview → confirm → result |
| `/admin/codes/imports` | `codes.manage` | Import history |
| `/admin/codes` | `codes.read` | Masked list + Import CTA |
| `/admin/inventory` | `codes.read` | Stock overview + Import CTA |

Product variant editor shows Available / Reserved / Delivered / Low stock and links to import with `?variant=<id>`.

## Inventory counts

Stock is **derived** from `DigitalCode` rows:

- Available / reserved / delivered counts annotated on variants
- After import/deactivate, `ProductVariant.stock_status` is set to `IN_STOCK` if any `AVAILABLE` codes exist, else `OUT_OF_STOCK`
- Low stock = `codes_available < SiteSettings.low_stock_threshold`

Do not maintain a separate manual stock counter for digital codes.

## RBAC

| Permission | Who (defaults) | What |
|------------|----------------|------|
| `codes.read` | Admin, Catalog mgr, Order mgr, Support, Viewer | List masked codes / inventory |
| `codes.manage` | Admin, Order mgr, Super | Import, manual create, deactivate, history |
| `codes.reveal` | Admin, Order mgr, Super | Decrypt one code (audited) |

Import does **not** grant reveal. Catalog managers can read inventory but not import unless granted `codes.manage`.

## Security rules

1. Never store plaintext codes in PostgreSQL outside ciphertext
2. Never log plaintext codes, PINs, or encryption keys
3. Never put plaintext in audit metadata, URLs, or localStorage
4. Preview APIs return masked values only
5. Error CSV downloads: `row,sku,error` — no code values
6. Reveal remains a separate permissioned endpoint

## Payment / OneEpin

Out of scope for this feature. Demo checkout still issues placeholder delivered codes. OneEpin live purchase stays locked.
