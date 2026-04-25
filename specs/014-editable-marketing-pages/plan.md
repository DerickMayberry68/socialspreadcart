# Implementation Plan: Editable Marketing Pages

**Branch**: `014-editable-marketing-pages` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/014-editable-marketing-pages/spec.md`

## Summary

Make all copy and image content on the main public marketing site editable by Shayley through admin forms. The implementation keeps existing specialized editors where they already work, adds typed page-content forms for the remaining hardcoded sections, and routes all public/admin content access through `SiteContentService`.

The technical approach adds a tenant-scoped page content table keyed by page area, typed fallbacks and validation schemas per page, generic service read/write helpers with typed wrappers, admin route handlers under `/api/admin/site-content/page-content/[pageKey]`, and form components under `/admin/site-content`. Public pages then consume saved content instead of hardcoded arrays and static `siteConfig` fields.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), React 19.2  
**Primary Dependencies**: Next.js 15.5 App Router, Server Components, Route Handlers, Supabase JS/SSR, Tailwind CSS 3.4, Zod 4.3, Radix Dialog handled error alerts, `sonner` notifications, existing `SiteContentService`, existing admin shell, `requireTenantAdmin`  
**Storage**: Supabase Postgres, new tenant-scoped `marketing_page_content` table. Existing gallery/about/menu/events/quote tables remain unchanged. Existing public `boards` bucket upload patterns remain available for page image URL fields; this pass primarily stores image URLs and alt text in page content.  
**Testing**: Manual QA for admin save-to-public render flows, `npx tsc --noEmit`, `npm run lint`, `npm test`, and build if time permits.  
**Target Platform**: Single Next.js web application deployed for public marketing site and admin shell.  
**Project Type**: Web application.  
**Performance Goals**: Public page content loads with one page-content lookup per page and one shared shell lookup in layout. Admin saves should complete in under 500ms excluding file upload time.  
**Constraints**:
- SocialSpreadCart remains a shared multi-tenant platform.
- Admin-editable public content must go through `src/services/site-content-service.ts`.
- Admin routes must authorize with `requireTenantAdmin()` before mutation.
- Existing operational editors and tables must not be overwritten.
- Public pages must keep polished fallbacks when saved content is missing or Supabase is unavailable.
- No general page builder, rich text editor, draft workflow, or versioning in this pass.
**Scale/Scope**: One shared shell content record plus page records for home, menu, cart service, events, and contact. Gallery and About are audited and only changed if gaps are found.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan satisfies it | Result |
|-----------|-----------------------------|--------|
| **I. Single Responsibility** | `SiteContentService` owns page content persistence and fallbacks; pages/components render content; admin components collect form input. | Pass |
| **II. Open/Closed** | Existing hero, pathway, gallery, about, menu, and event flows remain intact while new page content records cover missing sections. | Pass |
| **III. Liskov Substitution** | Service loaders always return complete typed shapes via saved content or fallbacks. | Pass |
| **IV. Interface Segregation** | Each page editor receives only the fields for that page or shared shell. | Pass |
| **V. Dependency Inversion** | Public pages and admin components depend on service/API contracts, not Supabase clients. | Pass |
| **UX & Brand** | Form-based admin UX follows existing site-content managers; public layout stays visually consistent. | Pass |
| **Technology Stack** | No new major dependencies or platform changes. | Pass |

No gate failures or unresolved clarifications remain.

## Project Structure

### Documentation (this feature)

```text
specs/014-editable-marketing-pages/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- page-content.contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (site)/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- menu/page.tsx
|   |   |-- events/page.tsx
|   |   |-- cart-service/page.tsx
|   |   `-- contact/page.tsx
|   |-- admin/(shell)/site-content/
|   |   |-- page.tsx
|   |   |-- shell/page.tsx
|   |   |-- home/page.tsx
|   |   |-- menu/page.tsx
|   |   |-- events/page.tsx
|   |   |-- cart-service/page.tsx
|   |   `-- contact/page.tsx
|   `-- api/admin/site-content/page-content/[pageKey]/route.ts
|-- components/
|   |-- admin/site-content/page-content-form.tsx
|   |-- sections/home-page.tsx
|   `-- shared/site-header.tsx, site-footer.tsx
|-- lib/
|   |-- page-content-defaults.ts
|   |-- types/site-content.ts
|   `-- validation/site-content.ts
`-- services/site-content-service.ts

supabase/
`-- migrations/
    `-- *_marketing_page_content.sql
```

**Structure Decision**: Continue as a single Next.js application. Use one flexible tenant-scoped page content table plus typed TypeScript/Zod page schemas so page editors remain form-based without creating a new table for every static page section.

## Design Direction

1. **Hybrid content model.** Keep existing structured tables for mature editors. Use `marketing_page_content` for remaining page-level content keyed by `shell`, `home`, `menu`, `events`, `cart-service`, and `contact`.
2. **Typed JSON content.** Store page payloads as JSON but validate every save and every service return with page-specific Zod schemas and defaults.
3. **Fallback-first rendering.** Every loader returns complete content by merging saved records over defaults, so public pages render if records are absent.
4. **One reusable admin form renderer.** Use a small reusable page-content form component for text, URL, textarea, image URL/alt, and repeatable cards/lists instead of many unrelated one-off forms.
5. **Immediate publish.** Saves invalidate the tenant site-content cache tag and relevant public paths.
6. **Tenant isolation.** Route handlers call `requireTenantAdmin()`, and database RLS limits writes to current tenant admins.

## Phase 0 Research Outputs

See [research.md](research.md).

## Phase 1 Design Outputs

- [data-model.md](data-model.md): entity shape, validation, lifecycle, and tenant boundaries.
- [contracts/page-content.contract.md](contracts/page-content.contract.md): admin GET/PATCH contract and public loader contract.
- [quickstart.md](quickstart.md): implementation and QA path.

## Post-Design Constitution Re-check

| Principle | Re-check result |
|-----------|-----------------|
| **I. Single Responsibility** | Pass: persistence is centralized in service and form components only handle editing. |
| **II. Open/Closed** | Pass: existing content flows remain intact and new page records cover missing surfaces. |
| **III. Liskov Substitution** | Pass: typed defaults keep return shapes stable. |
| **IV. Interface Segregation** | Pass: editors are scoped by page key. |
| **V. Dependency Inversion** | Pass: pages/components do not import Supabase clients. |
| **UX & Brand** | Pass: form-based editing follows current admin patterns. |
| **Technology Stack** | Pass: no new stack additions. |

No gate failures or unresolved clarifications remain.
