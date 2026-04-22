# Quickstart: Admin Gallery Content

## Goal

Verify a client admin can manage public gallery copy and images from Admin Site Content, and that the public gallery reflects saved tenant-scoped content.

## Prerequisites

- Supabase environment variables are configured.
- A tenant admin user can sign in to `/admin`.
- Existing site content feature 012 is present, including `SiteContentService`, `requireTenantAdmin`, and the `boards` storage bucket upload pattern.

## Implementation Path

1. Add a Supabase migration for gallery content:
   - `gallery_section_content`
   - `gallery_images`
   - RLS policies for public reads and admin-only writes
   - seed/backfill defaults for existing tenants
   - Concrete migration path: `supabase/migrations/20260424_admin_gallery_content.sql`

2. Extend shared content types and validation:
   - Add `GallerySectionContent`, `GalleryImage`, and `GalleryPageContent` types.
   - Add Zod schemas for gallery section and image save payloads.

3. Extend `SiteContentService`:
   - `getGallerySectionContent(tenantId)`
   - `getGalleryImages(tenantId)`
   - `loadGalleryPageContent(tenantId)`
   - `updateGalleryContent(tenantId, userId, patch)`
   - Preserve fallbacks for no Supabase, first-time tenants, and failed reads.

4. Refactor the public gallery page:
   - Stop using `getGalleryItems()` as the source of truth.
   - Load gallery content through `SiteContentService`.
   - Render zero, one, or many images without broken placeholders.
   - Keep the current visual presentation unless content changes require natural layout adjustments.

5. Add admin API routes:
   - `GET /api/admin/site-content/gallery`
   - `PATCH /api/admin/site-content/gallery`
   - `POST /api/admin/site-content/gallery/upload`
   - All routes start with `requireTenantAdmin()`.
   - Concrete route paths:
     - `src/app/api/admin/site-content/gallery/route.ts`
     - `src/app/api/admin/site-content/gallery/upload/route.ts`

6. Add admin UI:
   - Add a Gallery card to `/admin/site-content`.
   - Add `/admin/site-content/gallery`.
   - Support editing section copy.
   - Support adding, editing, removing, replacing, and reordering images.
   - Show field errors and success/failure feedback.
   - Concrete UI paths:
     - `src/app/admin/(shell)/site-content/gallery/page.tsx`
     - `src/components/admin/site-content/gallery-manager.tsx`

7. Revalidate public content after saves:
   - Revalidate `site-content:{tenantId}`.
   - Revalidate the public gallery route.

## Manual QA

### Add Image

1. Sign in as a tenant admin.
2. Open `/admin/site-content/gallery`.
3. Upload a new image.
4. Enter image title, eyebrow, and alt text.
5. Save.
6. Open `/gallery`.
7. Confirm the new image appears with the saved title and label.

### Edit Image

1. Open the gallery editor.
2. Change an existing image title and alt text.
3. Save.
4. Confirm `/gallery` reflects the updated content.

### Remove Image

1. Open the gallery editor.
2. Remove an image and confirm the removal.
3. Save.
4. Confirm the image no longer appears on `/gallery`.

### Reorder Images

1. Open the gallery editor.
2. Move an image to a different position.
3. Save.
4. Confirm `/gallery` displays the new order.

### Edit Copy

1. Open the gallery editor.
2. Change the gallery title, description, feature card title, and support card body.
3. Save.
4. Confirm `/gallery` displays the saved copy.

### Zero Images

1. Remove all gallery images.
2. Save.
3. Confirm `/gallery` shows no broken images and still handles the gallery section gracefully.

### Validation

1. Try saving an image without alt text.
2. Confirm the admin editor shows an actionable field error.
3. Confirm the public gallery keeps the last valid saved content.

### Tenant Isolation

1. Save gallery content as Tenant A.
2. Switch to or sign in as Tenant B.
3. Confirm Tenant B cannot see or edit Tenant A's gallery content.
4. Confirm Tenant B's public gallery is unchanged.

## Verification Commands

```bash
npx tsc --noEmit
npm test
npm run lint
```

## Expected Result

The client can manage public gallery images and copy from Admin Site Content. Saved changes appear on the public gallery without a developer deploy, invalid saves preserve the last published content, and gallery content stays scoped to the active tenant.
