# MMH storefront redesign audit

Audited 2026-09-14 before implementation.

## Shared reference patterns

- Compact, sticky, mobile-first header with hamburger, centered logo, search, account, language/currency and a cart summary.
- Full-height edge-aware category drawer, nested category disclosure, prominent close/back controls, and body scroll lock.
- Campaign-led homepage: hero first, visual category shortcuts, multiple dense product rails, promotional banners, trust/FAQ, newsletter and policy/payment footer.
- Compact equal-height product cards with a fixed artwork ratio, badge cluster, category/supporting copy, current/previous price, availability and a direct commerce action.
- Category pages use breadcrumbs, count/sort/filter controls, active-filter chips and responsive two-column mobile grids.
- Product pages prioritize gallery, compatibility/region, option selection, price, delivery expectations and sticky mobile add/buy actions.
- Cart and checkout minimize navigation distractions, retain product configuration, keep totals prominent and use sticky mobile completion actions.
- Digital orders omit shipping, confirm account/region details, and show pending payment/fulfillment status before any delivery.

## Existing MMH findings

- Logo and approved navy/purple/yellow tokens already exist and remain the brand foundation.
- PostgreSQL/Prisma already models published categories, nested `parentId`, banners, localized catalog content, product variants, required customer fields, integer JOD fils, pending orders and idempotency keys.
- Storefront catalog hydration reads published products/categories, but several UI paths still import static catalog arrays.
- Mobile navigation is visually functional but hardcodes category group membership and has only one disclosure level.
- Shop filtering is browser-side over the hydrated catalog snapshot; query parameters are shareable but filtering is not server-backed.
- Customer login/register/account views are local-storage demos and do not use the existing Auth.js credentials provider or PostgreSQL customer data.
- Checkout order creation recalculates prices transactionally in PostgreSQL, but the client and action fall back to a fake successful order on database errors. This must be removed.
- Payment UI exposes placeholders only; no verified payment provider is connected. Supplier submission is guarded and disabled.
- Admin product/category/banner/order controls use the existing Clicks Digitals theme and already revalidate key storefront routes after mutations.

## Route-by-route implementation checklist

- [ ] `/`: database banner carousel, category shortcuts, configurable product collections, promotional banner, trust, FAQ, support/newsletter and footer.
- [ ] `/shop`: server-backed filtering/sorting, count, breadcrumbs, URL state, active chips, desktop sidebar, mobile drawer, responsive grid and empty/loading states.
- [ ] `/category/[slug]`: published category guard, nested shortcuts, inherited category filtering and localized metadata.
- [ ] `/search`: server-backed search results using the same catalog controls.
- [ ] `/product/[slug]`: published guard, gallery, real prices/badges, variant/region/required-field validation, add/buy paths, related products and mobile purchase bar.
- [ ] `/cart`: configured line details, masked customer data, validated quantity controls, coupon UX, server-price notice, totals and sticky checkout action.
- [ ] `/checkout`: distraction-light digital checkout, contact/account step, product review, truthful payment availability, confirmations, idempotent pending-order creation and recoverable failures.
- [ ] `/order-success`: database-backed pending status using a safe public reference; never reveal demo codes as fulfilled goods.
- [ ] `/login`, `/register`: Auth.js/PostgreSQL customer authentication with generic errors and rate limiting.
- [ ] `/account`, `/account/orders`, `/account/orders/[number]`: authenticated customer data and strict ownership checks.
- [ ] Policy/contact/about/FAQ routes: preserve original MMH copy and localize navigation/layout.
- [ ] `/admin/**`: retain Clicks Digitals UI; only extend data controls/revalidation where required.

## Verification matrix

- [ ] 360, 390, 430, 768, 1024 and 1440 px widths.
- [ ] Arabic RTL and English LTR.
- [ ] Keyboard menu/search/filter/dialog behavior, Escape, focus trapping/restoration and visible focus.
- [ ] Standard code and player-ID/direct-top-up configuration.
- [ ] Cart merge/separation rules, quantity/remove and buy-now.
- [ ] Valid/invalid coupon behavior where database support is present.
- [ ] Pending order creation, idempotent retry, admin visibility and unpaid fulfillment block.
- [ ] Console/server logs, lint, typecheck, Vitest, Prisma checks, production build and HTTP smoke tests.

