# Implementation Plan: Admin Gallery Content

**Branch**: `001-admin-gallery-content` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-admin-gallery-content/spec.md`

## Summary

Give client admins an Admin Site Content editor for the public gallery. The feature adds tenant-scoped gallery section copy and an ordered gallery image collection, lets admins add/edit/remove/reorder gallery images, and refactors the public gallery page to render saved tenant content with safe fallbacks.

The technical approach extends the existing admin-editable content pattern from feature 012: data access stays in `SiteContentService`, route handlers live under `/api/admin/site-content`, admin pages live under `/admin/site-content`, validation uses shared Zod schemas, and public pages read through server-side service functions. Gallery uploads reuse the existing Supabase Storage `boards` bucket with a tenant-scoped `gallery/` path prefix.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), React 19.2  
**Primary Dependencies**: Next.js 15.5 (App Router, Server Components, Route Handlers), `@supabase/supabase-js` 2.102 + `@supabase/ssr` 0.10, Tailwind CSS 3.4, Zod 4.3, `sonner` for admin feedback, existing `SiteContentService`, existing admin shell components, `requireTenantAdmin`, `getSupabaseServerClient`, and `getSupabaseServiceRoleClient`.  
**Storage**: Supabase Postgres with two new tenant-scoped content tables (`gallery_section_content`, `gallery_images`). Supabase Storage continues to use the existing public `boards` bucket with tenant-scoped keys like `{tenantId}/gallery/...`.  
**Testing**: Manual QA against `spec.md` acceptance scenarios, plus existing Vitest suites via `npm test`. Route contracts are documented in `contracts/` and should be exercised by admin UI manual QA.  
**Target Platform**: Next.js app deployed as a single web application. Public gallery rendering is server-side; admin mutations use route handlers under `/api/admin/site-content/gallery`.  
**Project Type**: Web application (single Next.js app, no separate backend project).  
**Performance Goals**: Public gallery content loads with one singleton lookup and one ordered image lookup per tenant; warm public render should stay within the current page budget. Admin save responses should complete in under 500ms excluding image upload time.  
**Constraints**:
- All data access MUST go through `src/services/site-content-service.ts`.
- Public gallery must preserve safe fallback content when Supabase is unavailable or no tenant content exists.
- Admin routes MUST call `requireTenantAdmin()` before reading request bodies or mutating content.
- Public visitor reads may be available anonymously, but writes must be limited to tenant admins/owners.
- Gallery image records must include descriptive text for accessibility.
- Admin edits must revalidate the same tenant-scoped site content cache tag used by existing public content.
- No new fonts, hard-coded color system, or separate media library is introduced.
**Scale/Scope**: Low to moderate. One gallery section row per tenant and roughly 0-30 gallery image rows per tenant for the first release. Designed for simple editorial gallery management, not a general CMS or digital asset manager.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan satisfies it | Result |
|-----------|-----------------------------|--------|
| **I. Single Responsibility** | Gallery reads/writes live in `SiteContentService`; public page and admin components render content and call route handlers only. | Pass |
| **II. Open/Closed** | Gallery content is added beside existing site configuration, hero, and pathway card sections without changing their contracts. Existing shared UI primitives and admin shell patterns are reused. | Pass |
| **III. Liskov Substitution** | Service functions return stable typed shapes with fallback defaults. Validation schemas and DB constraints keep API responses compatible with declared types. | Pass |
| **IV. Interface Segregation** | Gallery section and gallery images expose narrow service and route contracts. Components receive only the fields they render or edit. | Pass |
| **V. Dependency Inversion** | Components and pages do not import Supabase clients. Route handlers and pages call service abstractions, and Supabase client construction remains in `src/lib/supabase/`. | Pass |
| **UX & Brand** | Admin UI uses existing controls and `sonner` feedback; public gallery uses existing brand tokens and typography. No new visual system is introduced. | Pass |
| **Technology Stack** | Pinned stack remains unchanged. Supabase remains the data and media backend. | Pass |

**No justified violations**, so the Complexity Tracking table is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-gallery-content/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- gallery-content.contract.md
|   `-- gallery-upload.contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md                  # Phase 2 output from /speckit.tasks
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (site)/
|   |   `-- gallery/
|   |       `-- page.tsx                         # reads gallery content through service
|   |-- admin/
|   |   `-- (shell)/
|   |       `-- site-content/
|   |           |-- page.tsx                     # adds Gallery card
|   |           `-- gallery/
|   |               `-- page.tsx                 # loads tenant gallery for editor
|   `-- api/
|       `-- admin/
|           `-- site-content/
|               `-- gallery/
|                   |-- route.ts                 # GET, PATCH
|                   `-- upload/
|                       `-- route.ts             # POST image upload
|-- components/
|   `-- admin/
|       `-- site-content/
|           `-- gallery-manager.tsx
|-- lib/
|   |-- data.ts                                  # stop returning fallback gallery directly
|   |-- fallback-data.ts                         # remains source for defaults
|   |-- types.ts                                 # gallery public type extension or bridge
|   |-- types/
|   |   `-- site-content.ts                      # gallery content types
|   `-- validation/
|       `-- site-content.ts                      # gallery PATCH schemas
`-- services/
    `-- site-content-service.ts                  # gallery reads/writes + fallbacks

supabase/
`-- migrations/
    `-- 20260424_admin_gallery_content.sql       # gallery tables, policies, seed/backfill
```

**Structure Decision**: Continue as a single Next.js application using the existing admin content boundaries. The feature extends `SiteContentService`, `src/lib/validation/site-content.ts`, and `src/lib/types/site-content.ts` instead of creating a separate gallery service, because gallery content is part of the same admin-editable public content domain and shares cache invalidation, tenant scoping, auth, and fallback behavior.

## Design Direction

1. **Two data records: section singleton plus image collection.** `gallery_section_content` stores the public gallery heading, description, and support-card copy. `gallery_images` stores the ordered image list. This mirrors how the public page is structured today while allowing zero or more images.

2. **Fallback-first public render.** `SiteContentService.loadGalleryPageContent(tenantId)` returns a complete section object and an ordered image array. If Supabase is unavailable or rows are missing, the service falls back to the current hardcoded gallery copy and `fallbackGallery`.

3. **PATCH saves the whole editor state.** The admin gallery editor sends the complete section payload plus the ordered image list. This makes reorder, remove, and edit operations deterministic and avoids partial state conflicts in the first release.

4. **Add and replace use a dedicated upload route.** `POST /api/admin/site-content/gallery/upload` accepts one image file and returns `{ imageUrl, path }`. It reuses the `boards` bucket and follows the pathway-card upload route with a different key prefix.

5. **Soft delete by omission from editor save.** Removing an image from the editor means it is omitted from the next PATCH payload. The service reconciles the submitted ordered image list for the tenant. Storage cleanup for orphaned files is out of scope for the first release.

6. **Ordering is explicit.** Every gallery image has a `display_order` integer. Admin reorder updates that order, and public rendering always sorts ascending.

7. **Tenant isolation at two layers.** Admin route handlers call `requireTenantAdmin()`. Database RLS permits public selects but limits insert/update/delete to tenant admins/owners through `admin_tenant_ids_for_current_user()`.

8. **Public gallery copy moves into defaults.** The current title, description, support-card heading, and support-card body become typed defaults so the public page remains visually and editorially unchanged before the client edits anything.

9. **No draft workflow.** Saves publish immediately, matching the existing site configuration, hero, and pathway cards behavior.

10. **No advanced media editing.** Cropping, focal points, captions per layout breakpoint, video, social embeds, and image cleanup jobs are future work.

## Phase 0 Research Outputs

Research resolves:
- Whether to extend `SiteContentService` or create a separate gallery service.
- Whether gallery storage should use the existing bucket or a new one.
- Whether admin saves should be item-level or whole-gallery.
- How to model zero-image galleries and fallback defaults.
- How public cache invalidation should work for gallery edits.

See [research.md](research.md).

## Phase 1 Design Outputs

Phase 1 produces:
- [data-model.md](data-model.md): table shapes, constraints, states, RLS policy shape, fallback model.
- [contracts/gallery-content.contract.md](contracts/gallery-content.contract.md): admin GET/PATCH and public loader contracts.
- [contracts/gallery-upload.contract.md](contracts/gallery-upload.contract.md): upload request/response and failure states.
- [quickstart.md](quickstart.md): end-to-end implementation and QA path.

## Post-Design Constitution Re-check

| Principle | Re-check result |
|-----------|-----------------|
| **I. Single Responsibility** | Pass: design keeps DB access in service and rendering in components. |
| **II. Open/Closed** | Pass: gallery is added as a new content section without changing existing content contracts. |
| **III. Liskov Substitution** | Pass: fallbacks and validation preserve stable return shapes. |
| **IV. Interface Segregation** | Pass: contracts are split between content save/load and upload. |
| **V. Dependency Inversion** | Pass: pages/components depend on service and route contracts, not Supabase clients. |
| **UX & Brand** | Pass: existing admin and public visual language is retained. |
| **Technology Stack** | Pass: no stack additions or upgrades required. |

No gate failures or unresolved clarifications remain.
