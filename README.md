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
RESEND_FROM=The Social Spread Cart <info@socialspreadcart.com>
QUOTE_NOTIFICATION_EMAIL=info@socialspreadcart.com
PAYMENT_PROVIDER=disabled
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_MENU_ITEM_TAX_CODE=...
TAX_ORIGIN_ADDRESS_LINE1=...
TAX_ORIGIN_ADDRESS_LINE2=
TAX_ORIGIN_ADDRESS_CITY=Bentonville
TAX_ORIGIN_ADDRESS_STATE=AR
TAX_ORIGIN_ADDRESS_POSTAL_CODE=...
TAX_ORIGIN_ADDRESS_COUNTRY=US
CHECKOUT_SUCCESS_URL=https://thesocialspreadcart.com/checkout/confirmation
CHECKOUT_CANCEL_URL=https://thesocialspreadcart.com/order-tray
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
- If `RESEND_API_KEY` is present, a notification email is also sent
- Without Supabase configured, the route returns a successful demo response so the UI remains usable during design review

## Guest ordering and payment

- Menu items can be added to the customer-facing Order Tray from `/menu`
- Checkout posts to `src/app/api/checkout/route.ts`, revalidates active tenant menu items server-side, creates a pending guest order, and starts hosted payment through the configured payment provider
- The payment layer lives in `src/services/payment-service.ts`; leave `PAYMENT_PROVIDER=disabled` while Chase details are pending
- Set `PAYMENT_PROVIDER=stripe` only when using Stripe test or live keys
- Stripe Tax must be enabled in the Stripe account before live tax collection
- Pickup orders use the `TAX_ORIGIN_ADDRESS_*` values for tax calculation; delivery and event handoff orders collect a fulfillment address
- `STRIPE_MENU_ITEM_TAX_CODE` is optional when the Stripe account has a default product tax code; set it when menu items need an explicit Stripe Tax code
- The checkout adds a customer-visible, non-taxable processing fee using an exact 2.6% gross-up formula; the fee is sent to Stripe as a separate line item with Stripe's non-taxable tax code
- Stripe webhooks post to `src/app/api/webhooks/stripe/route.ts`; configure the webhook signing secret as `STRIPE_WEBHOOK_SECRET`
- Paid orders appear in `/admin/orders` for authorized tenant admins only
- Run `supabase/migrations/20260428_guest_ordering_payment.sql` before testing checkout persistence
- Run `supabase/migrations/20260429_order_tax_fee_reconciliation.sql` before testing tax/fee reconciliation

### Chase payment discovery

Before switching `PAYMENT_PROVIDER` away from `stripe`, confirm which Chase product Shayley uses:

- Chase Payment Solutions online payments
- Chase QuickAccept
- Chase POS
- Chase Paymentech / Orbital
- Authorize.net or another Chase-backed gateway
- Whether Chase has enabled hosted checkout, API credentials, and webhook/payment-status callbacks for her account

The order and admin implementation is provider-neutral; only `src/services/payment-service.ts` and the provider webhook route should need to change once Chase answers are available.

## Deployment

### Vercel

1. Import the repo into Vercel
2. Add the environment variables from `.env.example`
3. Deploy
4. Point `TheSocialSpreadCart.com` to the Vercel project

## Notes

- The image slots are ready for real board photography and Supabase Storage URLs.
- The current visual treatment intentionally follows the supplied green/cream logo system and Instagram template mood.
- `npm run build` and `npm run lint` both pass in the current workspace.
