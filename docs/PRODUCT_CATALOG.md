# Product catalog & media (admin)

Django remains the source of truth for products, variants, media, and customer fields.

## Product structure

- **Product** — catalog item (`id` string PK, unique `slug`, status `DRAFT` | `PUBLISHED` | `ARCHIVED`)
- **ProductVariant** — sellable SKU with `price_fils` / `cost_fils` (integer fils; 1 JOD = 1000 fils)
- **ProductFieldDefinition** — checkout/customer fields (`TEXT`, `EMAIL`, `TEL`, `SELECT`) ordered by `sort_order`
- **MediaAsset** — product gallery images (`sort_order`, `is_primary`, `alt`, `storage_path`)
- **SupplierProductMapping** — links local product/variant → supplier external id (config only)

## Money

- Database/API: integer **fils**
- Admin UI: human-readable **JOD** (via `jodToFils` / `formatFils`)
- Never treat JS floats as canonical money

## Media

1. Upload via Django (`POST /api/v1/admin/products/{slug}/media/` or `/admin/media/upload/`)
2. Storage uses Django `default_storage` under `uploads/` (local media in development; S3-ready later)
3. Magic-byte validation: JPEG / PNG / WEBP / GIF only (no SVG)
4. Max 5 MB; oversized dimensions downscaled with Pillow (max edge 2000px)
5. Primary image syncs to `Product.image_url` for storefront compatibility
6. Reorder with move controls; delete cleans storage only if path unused
7. Frontend resolves URLs with `resolveMediaUrl()` — no hardcoded `localhost:8000`

## Inventory

Available / reserved / delivered counts are **derived from `DigitalCode`**, not a separate stock counter.

Import codes from the product editor: `/admin/codes/import?variant=<id>`.

## Supplier mapping

Admins may map OneEpin (or other) external product IDs to local variants.

- Requires `suppliers.write` to create/edit/delete mappings
- Credentials are never returned
- Live purchase remains **LOCKED** (`ONEEPIN_ALLOW_LIVE` unchanged)

## Admin workflow

1. Create product (`/admin/products/new`) — slug auto from name
2. Open editor sections: General → Media → Variants → Required fields → Inventory → Supplier
3. Upload primary + gallery images
4. Add variants (JOD prices → fils)
5. Define customer fields (order controls storefront form order)
6. Import digital codes per variant
7. Publish → **View on storefront** opens `/product/{slug}`

## Storefront sync

- Public catalog APIs remain Django-backed
- Field order follows `sort_order`
- Images prefer gallery primary / `image_url`
- Static TS fallback remains emergency-only — admins never edit fallback files

## RBAC

| Permission | Catalog ops |
|------------|-------------|
| `catalog.read` | List/view products |
| `catalog.write` | Create/edit/media/duplicate/archive |
| `codes.manage` | Import codes from product editor |
| `suppliers.write` | Supplier mappings |

## Security boundaries

- No Prisma / no frontend DB
- No digital code plaintext in product APIs
- No supplier secrets in product/mapping responses
- Payment integration out of scope
- OneEpin live purchase locked
