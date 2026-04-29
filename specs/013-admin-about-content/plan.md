# Implementation Plan: Admin About Content

**Branch**: `013-admin-about-content` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/013-admin-about-content/spec.md`

## Summary

Give client admins an Admin Site Content editor for the public About page. The feature adds tenant-scoped About section copy, three feature cards, and an ordered About image collection, then refactors the public About page to render saved tenant content with safe fallbacks.

The technical approach extends the existing admin-editable content pattern used by Site Configuration, Hero, Pathway Cards, and Gallery. Data access stays in `SiteContentService`, route handlers live under `/api/admin/site-content`, admin pages live under `/admin/site-content`, validation uses shared Zod schemas, admin handled failures use the existing modal alert component, and public pages read through server-side service functions.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), React 19.2  
**Primary Dependencies**: Next.js 15.5 (App Router, Server Components, Route Handlers), `@supabase/supabase-js` 2.102 + `@supabase/ssr` 0.10, Tailwind CSS 3.4, Zod 4.3, Radix Dialog for handled error alerts, `sonner` for success/info notifications, existing `SiteContentService`, existing admin shell components, `requireTenantAdmin`, `getSupabaseServerClient`, and `getSupabaseServiceRoleClient`.  
**Storage**: Supabase Postgres with three tenant-scoped content tables (`about_page_content`, `about_images`, `about_feature_cards`). Supabase Storage continues to use the existing public `boards` bucket with tenant-scoped keys like `{tenantId}/about/...`.  
**Testing**: Manual QA against `spec.md` acceptance scenarios, plus existing Vitest suites via `npm test`, type checking via `npx tsc --noEmit`, linting via `npm run lint`, and production compile via `npm run build`.  
**Target Platform**: Next.js app deployed as a single web application. Public About rendering is server-side; admin mutations use route handlers under `/api/admin/site-content/about`.  
**Project Type**: Web application (single Next.js app, no separate backend project).  
**Performance Goals**: Public About content loads with one singleton lookup, one ordered image lookup, and one ordered card lookup per tenant. Admin save responses should complete in under 500ms excluding image upload time.  
**Constraints**:
- All data access MUST go through `src/services/site-content-service.ts`.
- Public About page must preserve safe fallback content when Supabase is unavailable or no tenant content exists.
- Admin routes MUST call `requireTenantAdmin()` before reading request bodies or mutating content.
- Public visitor reads may be available anonymously, but writes must be limited to tenant admins/owners.
- About image records must include descriptive text for accessibility.
- Admin handled failures must use modal alerts and must not expose stack traces.
- Success and informational notifications remain non-blocking toasts.
- Admin edits must revalidate the same tenant-scoped site content cache tag used by existing public content.
- No new fonts, hard-coded color system, or separate media library is introduced.
**Scale/Scope**: Low to moderate. One About content row per tenant, exactly three About feature card rows per tenant, and roughly 1-6 About image rows per tenant for the first release. Designed for editorial About page management, not a general CMS or digital asset manager.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan satisfies it | Result |
|-----------|-----------------------------|--------|
| **I. Single Responsibility** | About reads/writes live in `SiteContentService`; public page and admin components render content and call route handlers only. | Pass |
| **II. Open/Closed** | About content is added beside existing site content sections without changing their contracts. Existing admin/content patterns are reused. | Pass |
| **III. Liskov Substitution** | Service functions return stable typed shapes with fallback defaults. Validation schemas and DB constraints keep API responses compatible with declared types. | Pass |
| **IV. Interface Segregation** | About content, image upload, and public loader contracts are narrow and purpose-specific. Components receive only the fields they render or edit. | Pass |
| **V. Dependency Inversion** | Components and pages do not import Supabase clients. Route handlers and pages call service abstractions, and Supabase client construction remains in `src/lib/supabase/`. | Pass |
| **UX & Brand** | Admin UI uses existing controls, modal handled errors, and toasts for success; public About page keeps the established brand layout. | Pass |
| **Technology Stack** | Pinned stack remains unchanged. Supabase remains the data and media backend. | Pass |

**No justified violations**, so the Complexity Tracking table is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/013-admin-about-content/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- about-content.contract.md
|   `-- about-upload.contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (site)/
|   |   `-- about/
|   |       `-- page.tsx                         # reads About content through service
|   |-- admin/
|   |   `-- (shell)/
|   |       `-- site-content/
|   |           |-- page.tsx                     # adds About card
|   |           `-- about/
|   |               `-- page.tsx                 # loads tenant About content for editor
|   `-- api/
|       `-- admin/
|           `-- site-content/
|               `-- about/
|                   |-- route.ts                 # GET, PATCH
|                   `-- upload/
|                       `-- route.ts             # POST image upload
|-- components/
|   `-- admin/
|       `-- site-content/
|           `-- about-manager.tsx
|-- lib/
|   |-- fallback-data.ts                         # About defaults
|   |-- media.ts                                 # existing image defaults
|   |-- types/
|   |   `-- site-content.ts                      # About content types
|   `-- validation/
|       `-- site-content.ts                      # About PATCH schemas
`-- services/
    `-- site-content-service.ts                  # About reads/writes + fallbacks

supabase/
`-- migrations/
    `-- 20260425000000_admin_about_content.sql   # About tables, policies, seed/backfill
```

**Structure Decision**: Continue as a single Next.js application using the existing admin content boundaries. The feature extends `SiteContentService`, `src/lib/validation/site-content.ts`, and `src/lib/types/site-content.ts` instead of creating a separate About service, because About content is part of the same admin-editable public content domain and shares cache invalidation, tenant scoping, auth, fallback behavior, and handled error patterns.

## Design Direction

1. **Three data groups: page singleton, image collection, card collection.** `about_page_content` stores the heading and story copy. `about_images` stores ordered About page images. `about_feature_cards` stores exactly three ordered cards.

2. **Fallback-first public render.** `SiteContentService.loadAboutPageContent(tenantId)` returns a complete content object, image array, and three-card tuple. If Supabase is unavailable or rows are missing, the service falls back to the current hardcoded About page copy, `cartGallery`, and current card copy.

3. **PATCH saves the whole editor state.** The admin About editor sends the complete page content payload plus images and cards. This keeps edits deterministic and mirrors the Gallery editor.

4. **Image changes use a dedicated upload route.** `POST /api/admin/site-content/about/upload` accepts one image file and returns `{ imageUrl, path }`. It reuses the `boards` bucket and follows the gallery upload route with an `about/` key prefix.

5. **Exactly three feature cards.** The editor exposes three cards because the public layout has three fixed card positions. Card icons remain selected by display order from the current visual set for v1.

6. **Ordering is explicit.** About images and feature cards have `display_order`. Public rendering always sorts ascending.

7. **Tenant isolation at two layers.** Admin route handlers call `requireTenantAdmin()`. Database RLS permits public selects but limits insert/update/delete to tenant admins/owners through `admin_tenant_ids_for_current_user()`.

8. **No draft workflow.** Saves publish immediately, matching existing site configuration, hero, pathway cards, and gallery behavior.

9. **Handled errors use modal alerts.** Admin save/upload failures are caught in the client and displayed through `HandledErrorAlert`; success and upload-complete notifications remain `sonner` toasts.

10. **No advanced media editing.** Cropping, focal points, video, social embeds, and image cleanup jobs are future work.

## Phase 0 Research Outputs

Research resolves:
- Whether to extend `SiteContentService` or create a separate About service.
- Whether About storage should use the existing bucket or a new one.
- Whether the editor should save item-level mutations or the whole About page state.
- How to model fixed About feature cards and variable About images.
- How handled errors and success notifications should be split in admin UI.

See [research.md](research.md).

## Phase 1 Design Outputs

Phase 1 produces:
- [data-model.md](data-model.md): table shapes, constraints, states, RLS policy shape, fallback model.
- [contracts/about-content.contract.md](contracts/about-content.contract.md): admin GET/PATCH and public loader contracts.
- [contracts/about-upload.contract.md](contracts/about-upload.contract.md): upload request/response and failure states.
- [quickstart.md](quickstart.md): end-to-end implementation and QA path.

## Post-Design Constitution Re-check

| Principle | Re-check result |
|-----------|-----------------|
| **I. Single Responsibility** | Pass: design keeps DB access in service and rendering in components. |
| **II. Open/Closed** | Pass: About is added as a new content section without changing existing content contracts. |
| **III. Liskov Substitution** | Pass: fallbacks and validation preserve stable return shapes. |
| **IV. Interface Segregation** | Pass: contracts are split between content save/load and upload. |
| **V. Dependency Inversion** | Pass: pages/components depend on service and route contracts, not Supabase clients. |
| **UX & Brand** | Pass: existing admin and public visual language is retained. |
| **Technology Stack** | Pass: no stack additions or upgrades required. |

No gate failures or unresolved clarifications remain.
