# The Social Spread Cart

Premium Next.js 15 + Supabase website for The Social Spread Cart, a Bentonville-based mobile snack and beverage cart brand serving NWA.

## Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS
- shadcn-style component primitives
- Framer Motion
- Supabase for data, auth, and storage
- Resend for optional quote notification emails

## Included

- Branded homepage, about, menu, cart service, events, gallery, contact, and admin routes
- Official uploaded logos and Instagram templates wired into the UI from `public/brand`
- Menu filtering UI, events calendar, testimonials carousel, floating CTA, sitemap, and robots
- Quote API route with Supabase persistence and optional Resend email
- Guest Order Tray checkout flow with hosted payment and tenant-scoped admin order review
- Supabase schema + seed content in [`supabase/migrations/20260407_initial_schema.sql`](/workspace/supabase/migrations/20260407_initial_schema.sql) and [`supabase/seed/seed.sql`](/workspace/supabase/seed/seed.sql)

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in the Supabase values.

3. Start the app:

```bash
npm run dev
```

4. Verify production build locally:

```bash
npm run build
```

## Supabase setup

1. Create a new Supabase project.
2. In the SQL Editor, run:
   - `supabase/migrations/20260407_initial_schema.sql`
   - `supabase/seed/seed.sql`
3. Create at least one Auth user in Supabase for `/admin`.
4. Add these environment variables:

```bash
NEXT_PUBLIC_SITE_URL=https://thesocialspreadcart.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM=The Social Spread Cart <info@socialspreadnwa.com>
QUOTE_NOTIFICATION_EMAIL=info@socialspreadnwa.com
PAYMENT_PROVIDER=disabled
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=...
SQUARE_ACCESS_TOKEN=...
SQUARE_LOCATION_ID=...
SQUARE_PROCESSING_FEE_PERCENT=2.5
SQUARE_WEBHOOK_SIGNATURE_KEY=...
SQUARE_WEBHOOK_NOTIFICATION_URL=https://www.socialspreadnwa.com/api/webhooks/square
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_MENU_ITEM_TAX_CODE=...
TAX_ORIGIN_ADDRESS_LINE1=...
TAX_ORIGIN_ADDRESS_LINE2=
TAX_ORIGIN_ADDRESS_CITY=Bentonville
TAX_ORIGIN_ADDRESS_STATE=AR
TAX_ORIGIN_ADDRESS_POSTAL_CODE=...
TAX_ORIGIN_ADDRESS_COUNTRY=US
CHECKOUT_SUCCESS_URL=https://www.socialspreadnwa.com/checkout/confirmation
CHECKOUT_CANCEL_URL=https://www.socialspreadnwa.com/order-tray
```

### Storage buckets

The migration creates two public buckets:

- `boards`
- `events`

Use those for production menu and event photography. The seed content currently uses the uploaded brand artwork so the site has a polished fallback even before photography is uploaded.

## Admin route

- Visit `/admin`
- Sign in with a Supabase Auth user
- Add menu items and events from the browser
- For heavier editing, use the Supabase dashboard directly

## Quote flow

- The contact form posts to `src/app/api/quote/route.ts`
- If `SUPABASE_SERVICE_ROLE_KEY` is present, quotes are persisted to Supabase
- If Resend is configured (`RESEND_API_KEY`, `RESEND_FROM`) and `QUOTE_NOTIFICATION_EMAIL` is set, an owner notification email is also sent. Delivery is best-effort: a failed or unconfigured send never blocks the submission, and the outcome is logged. The notification is never sent to the requesting customer.
- Without Supabase configured, the route returns a successful demo response so the UI remains usable during design review

## Guest ordering and payment

- Menu items can be added to the customer-facing Order Tray from `/menu`
- Checkout posts to `src/app/api/checkout/route.ts`, revalidates active tenant menu items server-side, creates a pending guest order, and starts hosted payment through the configured payment provider
- The payment layer lives in `src/services/payment-service.ts`; leave `PAYMENT_PROVIDER=disabled` until Sandbox acceptance is complete
- Set `PAYMENT_PROVIDER=square` with `SQUARE_ENVIRONMENT=sandbox` for Square Sandbox testing
- Square-hosted Payment Links automatically apply the location's catalog tax for custom amounts. Sandbox and production catalogs are separate, so configure and verify the tax in each environment.
- `SQUARE_PROCESSING_FEE_PERCENT` adds the confirmed non-taxable processing service charge to the Square Order. Square calculates the fee amount, and the website persists Square's returned totals rather than calculating the former 2.6% Stripe gross-up.
- Square webhooks post to `/api/webhooks/square`; the signature is validated with the exact `SQUARE_WEBHOOK_NOTIFICATION_URL` and `SQUARE_WEBHOOK_SIGNATURE_KEY`
- Subscribe the Square application to `payment.updated` and `refund.updated`
- Optional tipping, Square coupons, and Square loyalty are disabled for this checkout flow so the approved website total remains authoritative
- Approved delivery orders use a separate fixed non-taxable delivery service charge and invalidate the Square Payment Link when approval is withdrawn or expires
- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only during the transition window for sessions created before Square activation; no new Stripe sessions are created when `PAYMENT_PROVIDER=square`
- Paid orders appear in `/admin/orders` for authorized tenant admins only
- Run `supabase/migrations/20260428_guest_ordering_payment.sql` before testing checkout persistence
- Run `supabase/migrations/20260429_order_tax_fee_reconciliation.sql` before testing tax/fee reconciliation
- Run `supabase/migrations/20260624025854_square_payment_reconciliation.sql` before testing Square checkout or webhooks

### Square activation

1. Configure Sandbox credentials and validate the configured location.
2. Deploy a preview and register its exact `/api/webhooks/square` URL in the Square Sandbox application.
3. Complete pickup, cancellation, failed payment, no-browser-return, approved delivery, invalidated delivery link, refund, and duplicate-webhook tests.
4. Confirm there are no actionable pending Stripe Checkout sessions.
5. Add production Square credentials and the production webhook subscription in Vercel.
6. Set `SQUARE_ENVIRONMENT=production` and `PAYMENT_PROVIDER=square`.
7. Complete one low-value live payment and verify Square, website confirmation, stored totals, owner notification, and admin Orders all match.
8. Set `PAYMENT_PROVIDER=disabled` and redeploy immediately if production verification fails; leave webhooks enabled for reconciliation.

## Deployment

### Vercel

1. Import the repo into Vercel
2. Add the environment variables from `.env.example`
3. Deploy
4. Point `TheSocialSpreadCart.com` t
