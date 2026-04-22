# Quickstart: Admin About Content

## Goal

Let a tenant admin edit the public About page copy, About images, and three feature cards from Admin Site Content.

## Implementation Path

1. Apply the database migration:

   ```powershell
   supabase db push
   ```

2. Confirm migration creates and backfills:

   - `about_page_content`
   - `about_images`
   - `about_feature_cards`
   - RLS policies for public read and tenant-admin writes
   - seed/backfill defaults for existing tenants

3. Add fallback content and types:

   - `src/lib/fallback-data.ts`
   - `src/lib/types/site-content.ts`
   - `src/lib/validation/site-content.ts`

4. Extend `SiteContentService`:

   - `loadAboutPageContent(tenantId)`
   - `updateAboutContent(tenantId, userId, patch)`
   - fallback helpers for missing content/images/cards
   - cache invalidation for `/about`

5. Add admin route handlers:

   - `src/app/api/admin/site-content/about/route.ts`
   - `src/app/api/admin/site-content/about/upload/route.ts`

6. Add admin UI:

   - `src/app/admin/(shell)/site-content/about/page.tsx`
   - `src/components/admin/site-content/about-manager.tsx`
   - Add an About card to `src/app/admin/(shell)/site-content/page.tsx`

7. Refactor the public About page:

   - `src/app/(site)/about/page.tsx`
   - Read through `withCurrentTenant(SiteContentService.loadAboutPageContent)`
   - Render fallbacks when saved tenant content is unavailable

## Manual QA

1. Sign in as a tenant admin.
2. Open `/admin/site-content/about`.
3. Change the About heading, intro, story badge, story headline, and story paragraphs.
4. Upload or replace an About image and provide descriptive text.
5. Change all three feature cards.
6. Save.
7. Confirm success appears as a toast.
8. Open `/about` and confirm the public page reflects saved copy, images, and cards.
9. Try invalid inputs:
   - Blank required heading
   - Blank alt text
   - Invalid upload file
   - Overlong card body
10. Confirm handled failures appear in modal alerts without stack traces and previously published content remains unchanged.
11. Confirm a non-admin user cannot access or save another tenant's About content.

## Verification Commands

```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
```
