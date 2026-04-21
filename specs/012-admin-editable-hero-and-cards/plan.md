# Implementation Plan: Admin-Editable Hero and Pathway Cards

**Branch**: `012-admin-editable-hero-and-cards` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)

## Summary

Deliver the first slice of admin-editable public content: tenant-scoped
**Site Configuration** (brand name, tagline, booking CTA, support
contact), **Hero** content for the home page, and exactly three
**Pathway Cards** that sit below the hero. All three are authored
from the existing admin shell, rendered server-side on the public
home page (and sitewide header/footer for Site Configuration), and
protected by the existing tenant-admin role.

This feature introduces the first persistent *content* tables in the
app. Everything else (data access, image upload, admin UI shell,
auth/authz) follows established patterns: a Zod-validated service in
`src/services/`, an admin API route under `src/app/api/admin/`
reusing the storage-upload pattern from menu items, and an admin
page under `src/app/admin/(shell)/`. Public pages fetch through the
same service via Next.js Server Components. Safe defaults ensure
brand-new tenants and error paths still render a clean home page.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), React 19.2
**Primary Dependencies**: Next.js 15.5 (App Router, Server Components,
Server Actions, Route Handlers), `@supabase/supabase-js` 2.102 +
`@supabase/ssr` 0.10, Tailwind 3.4, Zod 4.3, `sonner` for toasts,
existing shared services (`TenantService`), existing admin shell
components (`src/app/admin/(shell)/...`), `getSupabaseServerClient`
and `getSupabaseServiceRoleClient` helpers.
**Storage**: Supabase Postgres — three new tenant-scoped tables
(`site_configuration`, `hero_content`, `pathway_cards`) with row-level
security keyed to `tenant_id`. Supabase Storage uses the existing
`boards` bucket for pathway card images, with tenant-scoped key
prefix `{tenantId}/pathway-cards/...` (mirrors the menu-items upload
route).
**Testing**: Manual QA against the acceptance scenarios in `spec.md`;
existing Playwright/unit suites must continue to pass. Contract-level
checks are captured as typed request/response interfaces in
`contracts/` and exercised by the admin UI during manual QA. No new
automated test framework is introduced.
**Target Platform**: Next.js app on Vercel (Node runtime). Public
pages are server-rendered; admin mutations go through POST/PATCH
route handlers under `/api/admin/site-content/...`.
**Project Type**: Web application (single Next.js app, no separate
backend project).
**Performance Goals**: Home page server render stays within current
budget (< 200ms TTFB p95 on warm cache). Content reads are three
single-row/single-table lookups, joined by `tenant_id`, all indexed.
Admin save round-trip < 400ms p95 excluding image upload.
**Constraints**:
- No direct Supabase calls from components or pages — all data access
  via `src/services/site-content-service.ts` (Constitution Principle V).
- No hex colors hard-coded in new components — use Tailwind tokens
  (Constitution UX & Brand).
- Hero and pathway cards fixed at current cardinality (1 hero, 3
  pathway cards) per spec FR-019.
- Cached public home page must pick up admin edits within a short
  freshness window (seconds to single-digit minute), not require a
  deploy.
- Tenant isolation enforced at the database (RLS) layer, not just in
  application code.
**Scale/Scope**: Low. ~1 row per tenant for `site_configuration` and
`hero_content`, exactly 3 rows per tenant for `pathway_cards`. Even
at 1,000 tenants this is ~5,000 total content rows.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How this plan satisfies it | Result |
|-----------|-----------------------------|--------|
| **I. Single Responsibility** | All data access lives in `src/services/site-content-service.ts`; the admin UI components only render forms and call the service. The public home page's new components only render content fed in from `loadHomePageContent(tenantId)`. No component queries Supabase. | Pass |
| **II. Open/Closed** | Pathway cards, hero, and site config are additive. Existing `home-page.tsx` consumes new props (`siteConfig`, `hero`, `pathwayCards`) with sensible defaults so the component stays backward-compatible while the admin wires up. New CVA variants are not needed — existing button/badge/card primitives are reused. | Pass |
| **III. Liskov Substitution** | Service functions return strictly typed shapes derived from Zod schemas; null-returning reads are explicit (`Promise<HeroContent | null>`). Generated DB types will be regenerated after the migration. No optional-turned-required surprise fields. | Pass |
| **IV. Interface Segregation** | Three narrow service groups: `SiteConfigurationService`, `HeroContentService`, `PathwayCardService` — grouped under a single `SiteContentService` namespace only for import ergonomics. Components take just the props they render; no wide pass-through. | Pass |
| **V. Dependency Inversion** | Components and pages import from `@/services/...`, not from `@supabase/supabase-js`. The existing `getSupabaseServerClient` / `getSupabaseServiceRoleClient` helpers remain the only instantiation points. Image upload endpoint reuses the pattern in `src/app/api/admin/menu-items/upload/route.ts`. | Pass |
| **UX & Brand** | Admin forms use existing shadcn-style primitives and `sonner` for feedback. Public rendering keeps Tailwind tokens (`cream`, `sage`, `gold`, new `walnut` family from the refresh branch). Validation is Zod-driven with inline field errors. No new fonts or color hexes are introduced. | Pass |
| **Tech Stack** | Pinned stack unchanged. Supabase remains the only data/store backend. No new external service. `resend` is not involved. | Pass |

**No justified violations**, so the Complexity Tracking table is
omitted.

## Project Structure

### Documentation (this feature)

```text
specs/012-admin-editable-hero-and-cards/
├── spec.md                       # Already authored
├── plan.md                       # This file
├── research.md                   # Phase 0 output
├── data-model.md                 # Phase 1 output
├── quickstart.md                 # Phase 1 output
├── contracts/                    # Phase 1 output
│   ├── site-configuration.contract.md
│   ├── hero-content.contract.md
│   └── pathway-cards.contract.md
├── checklists/
│   └── requirements.md
└── tasks.md                      # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (site)/
│   │   ├── layout.tsx                       # consumes siteConfig (header/footer)
│   │   └── page.tsx                         # passes hero + pathways to HomePage
│   ├── admin/
│   │   └── (shell)/
│   │       └── site-content/
│   │           ├── page.tsx                 # overview / nav hub (optional)
│   │           ├── site-configuration/page.tsx
│   │           ├── hero/page.tsx
│   │           └── pathway-cards/page.tsx
│   └── api/
│       └── admin/
│           └── site-content/
│               ├── site-configuration/route.ts      # GET, PATCH
│               ├── hero/route.ts                    # GET, PATCH
│               ├── pathway-cards/route.ts           # GET, PATCH (bulk upsert of 3)
│               └── pathway-cards/upload/route.ts    # POST (image upload)
├── components/
│   ├── admin/
│   │   └── site-content/
│   │       ├── site-configuration-form.tsx
│   │       ├── hero-form.tsx
│   │       └── pathway-cards-manager.tsx
│   ├── sections/
│   │   └── home-page.tsx                    # refactor to consume props
│   └── shared/
│       ├── site-header.tsx                  # consumes siteConfig
│       └── site-footer.tsx                  # consumes siteConfig
├── services/
│   └── site-content-service.ts              # new: all 3 content types + defaults
├── lib/
│   ├── site.ts                              # extend: default fallbacks
│   └── types/                               # or extend existing src/lib/types.ts
│       └── site-content.ts                  # exported TS types
└── types/                                    # zod schemas for contracts
    └── site-content.ts

supabase/
├── migrations/
│   └── 20260421_site_content.sql            # creates 3 tables + RLS + seeds
└── seed/
    └── seed.sql                             # extend with tenant defaults for Shayley
```

**Structure Decision**: Continue as a **single Next.js app** with
the existing `src/` layout. No new top-level project or package is
introduced. New files slot into the existing `services/`,
`components/admin/`, `app/admin/(shell)/`, and `app/api/admin/`
structure, mirroring how menu items were built.

## Design Direction (high-level)

1. **Three content tables, one service file.** Even though there are
   three domain objects (`site_configuration`, `hero_content`,
   `pathway_cards`), they share tenancy, RLS pattern, and admin shell
   location. A single `site-content-service.ts` file with three
   grouped namespaces keeps the import surface narrow while avoiding
   a mega-service.

2. **Upsert, not create/delete.** `site_configuration` and
   `hero_content` are singletons per tenant. Pathway cards are
   exactly three per tenant. The admin flow is "load, edit, save"
   — there's no "add" or "remove" to design around. The DB seeds
   defaults when a tenant is created so the singletons always exist.

3. **Cards are upserted as a set of three, ordered by
   `display_order`.** The PATCH endpoint for pathway cards accepts
   an array of exactly three records keyed by `display_order`
   (1, 2, 3). Reorder = reassign `display_order`. This avoids a
   separate "reorder" endpoint and keeps the form state simple.

4. **Image upload mirrors menu items.** New route
   `POST /api/admin/site-content/pathway-cards/upload` reuses the
   existing `boards` bucket with key prefix
   `{tenantId}/pathway-cards/...`. The response returns an
   `imageUrl` and `path` exactly like the menu-items upload route,
   so the admin form can set `image_url` on state the same way.

5. **Safe defaults on read.** `SiteContentService.loadHomePageContent`
   returns a `{ siteConfig, hero, pathwayCards }` bundle, filling any
   missing record with neutral, professional defaults so the home
   page always has three cards and a full hero to render (FR-014,
   FR-022, FR-031). Defaults live in `src/lib/site.ts` (extending
   the existing site constants file).

6. **Authorization at two layers.**
   - Postgres RLS: policies on the three new tables scope reads/
     writes to members of the record's tenant, with `update` limited
     to `admin`/`owner` roles (consistent with spec 006).
   - Route handlers: `getCurrentTenant` + a role check reusing the
     existing admin-shell auth gate; return 401/403 before hitting
     the service. Service functions assume the caller already
     resolved the tenant and do NOT re-query auth on every call.

7. **Cache freshness.** Public home page uses Next.js route-level
   revalidation with a short `revalidate` (e.g., 60s) and an
   explicit `revalidatePath('/')` / `revalidateTag('site-content:{tenantId}')`
   call from the admin PATCH handlers, so edits appear within the
   freshness window without a deploy (FR-030). Exact caching
   parameters are finalized in `research.md`.

8. **Hero copy is content, not config.** The hero schema explicitly
   stores four pieces: headline, optional sub-line (the smaller
   accent line introduced during the barn-wood refresh), body, and
   two CTAs. The admin form previews live character counts and
   hides empty CTAs from the public render (FR-011, FR-012).

9. **No tenant theming yet.** This feature adds editable *copy and
   imagery*, not colors/fonts. Brand configuration (spec 005) owns
   theming. `siteConfig.brandName` and `siteConfig.brandTagline` are
   text only.

10. **Backward compatibility during migration.** The current
    hardcoded content in `home-page.tsx`, `site-header.tsx`, and
    `site-footer.tsx` is moved into `src/lib/site.ts` defaults.
    Components then read from props supplied by the page loader.
    Because the defaults preserve today's copy, the change is a
    no-op for the public site until an admin actually edits content.

## Implementation Order (high-level — detailed tasks in `tasks.md`)

1. **Data model & migration** — create `site_configuration`,
   `hero_content`, `pathway_cards` tables + RLS + seed for the
   existing Social Spread tenant. Regenerate types.
2. **Service layer** — `src/services/site-content-service.ts` with
   Zod schemas, read/upsert functions, and a `loadHomePageContent`
   composite loader with default-filling.
3. **Extract current hardcoded copy into defaults** — move today's
   hero copy, pathway cards, brand name, tagline, and booking CTA
   into typed defaults in `src/lib/site.ts` (public site behavior
   unchanged).
4. **Refactor public surfaces to consume props** — `home-page.tsx`,
   `site-header.tsx`, `site-footer.tsx` accept `siteConfig`, `hero`,
   `pathwayCards` props; `(site)/layout.tsx` and `(site)/page.tsx`
   call the service and pass them down.
5. **Admin API routes** — GET/PATCH handlers for the three content
   types plus the pathway-cards image upload, with server-side
   admin-role enforcement and `revalidateTag`/`revalidatePath`.
6. **Admin UI** — three forms under `/admin/site-content/...`,
   following the menu-items manager pattern (controlled state,
   `sonner` toasts, inline Zod-based validation, image upload
   button that sets `image_url` on success).
7. **Safe-default path** — verify brand-new tenant and
   service-failure scenarios render defaults.
8. **Cross-tenant isolation test** — manual QA: create/impersonate
   two tenants, verify edits in A leave B untouched and vice versa.

## Risks & Mitigations

- **Migration on a live tenant could double-seed or skip seed.**
  Mitigation: migration uses `INSERT ... ON CONFLICT (tenant_id) DO NOTHING`
  for singletons, and inserts exactly three pathway cards per
  tenant keyed by `(tenant_id, display_order)` with the same
  `ON CONFLICT DO NOTHING` guard.
- **RLS misconfiguration silently exposes cross-tenant content.**
  Mitigation: policies are written per-verb (select/insert/update/
  delete) and manually tested with two tenant users before the
  admin UI lands. The `data-model.md` calls out the exact policy
  shape.
- **Cache too aggressive — admin edits don't appear.** Mitigation:
  admin PATCH handlers call `revalidateTag('site-content:{tenantId}')`
  and the home page uses the corresponding `cacheTag`. Research
  pins the exact API (Next 15 cache components / `revalidateTag`).
- **Refactoring `home-page.tsx` to props breaks the public site.**
  Mitigation: the defaults module preserves today's exact strings
  and images so the pre-admin world and post-admin-with-no-edits
  world render identically.
- **Image upload leaks storage for deleted/replaced pathway images.**
  Mitigation: acceptable cost at this scale; out of scope for this
  feature. A cleanup pass is tracked as a future concern, not a
  gating item here.
- **Brand configuration spec (005) overlap.** Mitigation: site
  configuration in this spec is strictly text (name, tagline,
  booking CTA, support contact). When 005 lands, theming fields
  join a different table or extend this one in a clearly-named
  migration — not silently.

## Out Of Scope

- Editable menu editorial blocks, booking-page copy, testimonials,
  events, or any other site section (future specs).
- Generic "content block" CMS (slot-based, arbitrary sections).
- Tenant theming: colors, fonts, logos-as-assets (spec 005).
- Versioning / drafts / publish-workflow / scheduled publishing.
- Localization / multilingual content.
- Image optimization beyond what Next.js `next/image` already does
  for the menu-items flow.
- Storage cleanup for orphaned pathway-card images.

## Phase 0 → research.md

Phase 0 resolves the remaining technical unknowns:
- Exact Next.js 15 caching strategy for edit-to-visible freshness.
- Exact auth/role check pattern reused from the admin shell.
- Exact image-upload contract mirroring menu items.
- Seed strategy for existing and future tenants.
- Content length limits (headline, sub-line, body, CTA labels,
  pathway card title/copy/badge).

See `research.md`.

## Phase 1 → data-model.md, contracts/, quickstart.md

Phase 1 produces:
- `data-model.md`: table DDL, constraints, indexes, RLS policies.
- `contracts/site-configuration.contract.md`: GET + PATCH shapes.
- `contracts/hero-content.contract.md`: GET + PATCH shapes.
- `contracts/pathway-cards.contract.md`: GET + PATCH shapes + upload.
- `quickstart.md`: the minimal end-to-end path from migration to
  a Shayley-edited home page.

Post-Phase-1, the Constitution Check is re-evaluated; no changes
are expected.
