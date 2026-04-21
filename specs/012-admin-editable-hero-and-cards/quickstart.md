# Quickstart: Admin-Editable Hero and Pathway Cards

**Feature**: 012-admin-editable-hero-and-cards
**Audience**: A developer picking up this feature for the first time.
**Goal**: Walk the end-to-end path — migration → service → public
render → admin edit → cache invalidation → public re-render — in
fewer than 10 minutes.

---

## 1. Prereqs

- Dev environment already bootstrapped (Supabase local + Next.js
  dev server + at least one tenant seeded).
- You are a tenant `owner` or `admin` on the local tenant
  (`The Social Spread` is fine).
- Node 20+, `pnpm` or `npm` matching `package.json`.

---

## 2. Apply the migration

```powershell
# from repo root
npx supabase db push           # or: npx supabase migration up
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

After this step:
- Tables `site_configuration`, `hero_content`, `pathway_cards`
  exist with RLS enabled.
- The existing Social Spread tenant has one row in each singleton
  table and three rows in `pathway_cards`.
- Generated TS types include the three new tables.

Verify:

```sql
select count(*) from site_configuration;   -- expect: # of tenants
select count(*) from hero_content;         -- expect: # of tenants
select tenant_id, count(*) from pathway_cards group by 1;
-- expect: 3 per tenant
```

---

## 3. Hit the service from a Server Component

Spin up the Next.js dev server and load `/`. The home page calls:

```ts
// src/app/(site)/page.tsx (conceptual)
import { SiteContentService } from "@/services/site-content-service";
import { getCurrentTenant } from "@/lib/tenant";

export default async function HomePage() {
  const tenant = await getCurrentTenant();
  const { siteConfig, hero, pathwayCards } =
    await SiteContentService.loadHomePageContent(tenant.id);

  return <HomePage siteConfig={siteConfig} hero={hero} pathwayCards={pathwayCards} />;
}
```

The rendered page should be **visually identical** to today's home
page, because the seeded defaults match the current hardcoded copy.

---

## 4. Edit the hero in the admin

1. Sign into `/admin` as a tenant admin.
2. Navigate to **Site Content → Hero**.
3. Change the headline to something new (e.g., "Bookings open for
   summer events.").
4. Click **Save**. The `sonner` toast confirms "Hero updated."

Under the hood:
- The form POSTs to `PATCH /api/admin/site-content/hero`.
- The handler validates with Zod, calls
  `SiteContentService.updateHero({ tenantId, ...body })`, writes
  via the service-role client, and then:
  - `revalidateTag("site-content:" + tenantId)`
  - `revalidatePath("/")`

---

## 5. Verify the change is live

Reload `/` in another browser tab. The new headline appears within
the freshness window (typically immediately after the tag
invalidation, capped at the 60s `revalidate`).

If it doesn't appear within ~60s:
- Check the server console for errors from `revalidateTag`.
- Confirm the home-page server component actually uses the tagged
  cache (see `SiteContentService.loadHomePageContent`).

---

## 6. Edit a pathway card (with image upload)

1. Navigate to **Site Content → Pathway Cards**.
2. Click **Upload image** on card 2. Select a JPG/PNG.
3. The image thumbnail updates. `imageUrl` on the form state is
   set to the response `imageUrl` from
   `POST /api/admin/site-content/pathway-cards/upload`.
4. Change card 2's title. Drag card 3 above card 1 to reorder.
5. Click **Save**.

Under the hood:
- The form PATCHes `/api/admin/site-content/pathway-cards` with
  exactly three cards, each carrying its chosen `displayOrder`.
- The service upserts all three rows in one transaction.
- `revalidateTag("site-content:" + tenantId)` and
  `revalidatePath("/")` fire.

Reload `/` and confirm the new image, title, and order render.

---

## 7. Cross-tenant smoke check

Sign into a second tenant's admin. Load **Site Content → Hero**:
its hero should still be that tenant's seeded defaults — **not**
the edit you just made on tenant A. This confirms tenant isolation
at the admin layer.

Load the second tenant's public home page (via its slug/domain).
Its home page MUST render *its* content only.

---

## 8. Safe-default smoke check

Delete a row for testing (dev only):

```sql
delete from hero_content where tenant_id = '...';
```

Reload `/` for that tenant. The home page MUST render a
professional-looking default hero (served from the application
defaults in `src/lib/site.ts`) — not a 500 and not a blank section.

Reinstate via the seed trigger:

```sql
-- Easiest: re-run the seed block for that tenant. The trigger only
-- fires on tenant INSERT, so for dev use a one-off INSERT.
insert into hero_content (tenant_id, headline, sub_line, body,
  primary_cta_label, primary_cta_target,
  secondary_cta_label, secondary_cta_target)
values ('<tenant-id>', 'An elevated approach...', 'Snacks & sips, served your way.',
  'The Social Spread is a luxury mobile cart...',
  'Start Your Order', '/contact',
  'Browse the Menu', '/menu');
```

---

## 9. Done

You have exercised:
- Migration + seed trigger + RLS.
- Service read with cache tag.
- Admin GET/PATCH flows.
- Admin image upload.
- Public re-render via tag invalidation.
- Cross-tenant isolation.
- Safe-default fallback.

At this point the feature is behaviorally complete. The Phase 2
`tasks.md` (generated by `/speckit.tasks`) will enumerate the
concrete files, tests, and commit boundaries.
