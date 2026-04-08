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
