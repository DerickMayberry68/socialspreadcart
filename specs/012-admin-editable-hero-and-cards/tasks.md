---

description: "Task list for 012-admin-editable-hero-and-cards"
---

# Tasks: Admin-Editable Hero and Pathway Cards

**Input**: Design documents from `/specs/012-admin-editable-hero-and-cards/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: The spec does not request automated tests for this feature. Verification is
via the manual QA steps captured in `quickstart.md` and the acceptance scenarios in
`spec.md`. No automated test tasks are included.

**Organization**: Tasks are grouped by user story so each P1 story can be shipped
and verified independently. US4 (tenant isolation) and US5 (safe defaults) are
cross-cutting verification stories delivered by the Foundational phase and
confirmed in their own phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5)
- All file paths are absolute-from-repo-root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature-scoped scaffolding. The repo, toolchain, and lint config
already exist; setup is minimal.

- [ ] T001 Create admin UI folder `src/components/admin/site-content/` (empty directory with `.gitkeep` if needed) for the three admin form components added in later phases.
- [ ] T002 Create admin route folder `src/app/admin/(shell)/site-content/` (empty directory with `.gitkeep` if needed) for the three admin pages added in later phases.
- [ ] T003 Create API route folder `src/app/api/admin/site-content/` (empty directory with `.gitkeep` if needed) for the admin route handlers added in later phases.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model, service layer, shared defaults, and the public-site
refactor that makes content render from props. **All three P1 user stories
(US1, US2, US3) depend on this phase; it inherently delivers US4 (tenant
isolation via RLS + route guard) and US5 (safe defaults via service fallback).**

**⚠️ CRITICAL**: No user story work may begin until this phase is complete.

### Database & Types

- [ ] T004 Create migration `supabase/migrations/20260421_site_content.sql` per `data-model.md`: three tables (`site_configuration`, `hero_content`, `pathway_cards`) with length CHECK constraints, composite PK on pathway_cards, `ON DELETE CASCADE` to `tenants(id)`, `updated_at`/`updated_by` columns.
- [ ] T005 In the same migration file `supabase/migrations/20260421_site_content.sql`, enable RLS on all three tables and add the per-verb policies from `data-model.md` (public SELECT, admin-only INSERT/UPDATE via `is_tenant_admin(tenant_id)`).
- [ ] T006 In the same migration file `supabase/migrations/20260421_site_content.sql`, add the `seed_site_content_for_tenant()` function and the `AFTER INSERT ON tenants` trigger, then append the one-time `INSERT ... SELECT FROM tenants ... ON CONFLICT DO NOTHING` backfill so every existing tenant gets its singletons and three cards.
- [ ] T007 Apply the migration locally (`npx supabase db push`) and regenerate DB types by running `npx supabase gen types typescript --linked` and writing the output to the project's existing generated types file (path per repo convention; keep path consistent with how `menu_items` types are imported today).
- [ ] T008 Extend `supabase/seed/seed.sql` with explicit dev-seed rows for the Social Spread tenant's `site_configuration`, `hero_content`, and three `pathway_cards` so `supabase db reset` populates realistic content.

### Shared Defaults & Types (code)

- [ ] T009 [P] Create `src/lib/types/site-content.ts` exporting the TS types `SiteConfiguration`, `HeroContent`, `PathwayCard`, and `HomePageContent` exactly as specified in `data-model.md` (camelCase at the app boundary).
- [ ] T010 [P] Create `src/lib/validation/site-content.ts` exporting Zod schemas `siteConfigurationPatchSchema`, `heroContentPatchSchema`, and `pathwayCardsPatchSchema` that enforce the length limits from research R-005 and the CTA/link target rule from R-006 (relative `/...` or absolute `https://...`; `http://` rejected).
- [ ] T011 Extend `src/lib/site.ts` with exported default constants `DEFAULT_SITE_CONFIGURATION`, `DEFAULT_HERO_CONTENT`, and `DEFAULT_PATHWAY_CARDS` whose string values preserve **today's** hardcoded home-page copy so post-refactor rendering is pixel-identical when no DB rows exist.

### Service Layer

- [ ] T012 Create `src/services/site-content-service.ts` with Zod-validated read functions `getSiteConfiguration(tenantId)`, `getHeroContent(tenantId)`, and `listPathwayCards(tenantId)`. Each returns the DB row shape mapped to camelCase types from `src/lib/types/site-content.ts`, or `null`/`[]` on missing rows. Uses `getSupabaseServerClient()` only — no SDK calls elsewhere.
- [ ] T013 In `src/services/site-content-service.ts`, add the composite loader `loadHomePageContent(tenantId): Promise<HomePageContent>` that calls the three readers, fills any null/short result with `DEFAULT_SITE_CONFIGURATION` / `DEFAULT_HERO_CONTENT` / `DEFAULT_PATHWAY_CARDS` (preserving `displayOrder` 1-3), logs a warning on fill, and returns a fully populated bundle.
- [ ] T014 In `src/services/site-content-service.ts`, add `upsertSiteConfiguration`, `upsertHeroContent`, and `upsertPathwayCards` write functions. Each validates input with the Zod schemas from T010, writes via the service-role client (`getSupabaseServiceRoleClient`) because RLS still keys on the explicit `tenant_id`, sets `updated_by` to the current user id, and returns the refreshed row(s).
- [ ] T015 Wrap the three readers in `src/services/site-content-service.ts` with Next.js cache using `unstable_cache` (or the project's standard cache wrapper) tagged `site-content:{tenantId}` so `revalidateTag` from the admin PATCH handlers invalidates them.

### Admin Authorization Helper

- [ ] T016 Create `src/lib/admin/require-tenant-admin.ts` exporting `async function requireTenantAdmin()` that: calls `getSupabaseUser()` (401 if null), `getCurrentTenant()` (404 if null), and `TenantService.getMembershipForUser(tenant.id, user.id)` (403 unless role is `owner` or `admin`). Returns `{ user, tenant, membership }`. Reused by every admin route handler in Phases 3–5.

### Public-Site Prop Refactor (backward-compat under default copy)

- [ ] T017 Refactor `src/components/sections/home-page.tsx` to accept new props `siteConfig: SiteConfiguration`, `hero: HeroContent`, `pathwayCards: readonly PathwayCard[]`. Replace the current hardcoded hero strings and the `pathways` constant array with renders sourced from these props. Hide empty hero sub-line and empty hero CTAs (FR-011, FR-012); hide empty pathway badges (FR-020).
- [ ] T018 [P] Refactor `src/components/shared/site-header.tsx` to accept `siteConfig` (or specifically `brandName` and `bookingCta: {label, target}`) and render the wordmark + sticky booking button from those values.
- [ ] T019 [P] Refactor `src/components/shared/site-footer.tsx` to accept `siteConfig` and render the brand block (name), tagline, and support phone/email (hiding each when empty/null) plus the primary booking CTA using `siteConfig.bookingCtaLabel`/`bookingCtaTarget`.
- [ ] T020 Refactor `src/app/(site)/layout.tsx` to resolve the current tenant via `getCurrentTenant()`, call `SiteContentService.loadHomePageContent(tenant.id)`, and pass `siteConfig` down to `SiteHeader` and `SiteFooter`.
- [ ] T021 Refactor `src/app/(site)/page.tsx` to call `SiteContentService.loadHomePageContent(tenant.id)` and pass `siteConfig`, `hero`, and `pathwayCards` into `<HomePage />`. Set `export const revalidate = 60` on the route per research R-001.
- [ ] T022 Audit and update remaining primary booking CTAs outside the hero (bottom CTA band, sticky nav, anywhere else in `src/components/sections/home-page.tsx`) to read their label/target from `siteConfig.bookingCtaLabel` / `siteConfig.bookingCtaTarget` so a single admin edit changes every instance (FR-005, FR-019 of spec 011 carryover, SC-003 here).

**Checkpoint**: Running `/` renders visually identically to today. The home page,
header, and footer are now content-driven with safe defaults. US4 (tenant
isolation via RLS + `tenantId` scoping) and US5 (safe defaults on missing rows
or service error) are effectively delivered and will be verified in Phase 6 and
Phase 7. User-story implementation phases can now begin.

---

## Phase 3: User Story 1 - Shayley Updates The Hero Without A Developer (Priority: P1) 🎯 MVP

**Goal**: A tenant admin can edit the Hero section (headline, sub-line, body, two CTAs) from the Admin section and see the change reflected on `/` within the freshness window.

**Independent Test**: Sign in as a tenant admin, open `/admin/site-content/hero`, change the headline, save, reload `/`, and verify the new headline renders.

### Implementation for User Story 1

- [ ] T023 [P] [US1] Create GET route handler at `src/app/api/admin/site-content/hero/route.ts` that calls `requireTenantAdmin()` then `SiteContentService.getHeroContent(tenant.id)`, returning `{ ok: true, data }` per `contracts/hero-content.contract.md`; returns `DEFAULT_HERO_CONTENT` for `data` if the DB row is missing.
- [ ] T024 [US1] In the same file `src/app/api/admin/site-content/hero/route.ts`, add the PATCH handler that parses the body with `heroContentPatchSchema`, enforces the coherence rule (non-empty CTA target requires non-empty CTA label) from the hero contract, calls `SiteContentService.upsertHeroContent`, then calls `revalidateTag("site-content:" + tenant.id)` and `revalidatePath("/")` before returning `{ ok: true, data }`.
- [ ] T025 [P] [US1] Create `src/components/admin/site-content/hero-form.tsx` as a client component: controlled form state for all 7 fields, live character count next to each length-limited input (headline, sub-line, body, CTA labels), inline Zod-derived error messages, `sonner` toast on success/failure, submit hits PATCH endpoint from T024.
- [ ] T026 [US1] Create `src/app/admin/(shell)/site-content/hero/page.tsx` as a server component that calls `requireTenantAdmin()`, fetches current hero via the service, and renders `<HeroForm initialValue={...} />`.
- [ ] T027 [US1] Add a "Site Content → Hero" nav entry to the existing admin shell sidebar (whichever file defines the admin nav items from spec 008) pointing to `/admin/site-content/hero`.
- [ ] T028 [US1] Manual QA against acceptance scenarios 1-6 of US1 in `spec.md`: pre-populated form, headline edit appears on `/`, empty sub-line hides the sub-line element, invalid CTA target is blocked with a useful message, over-length headline is blocked, empty primary CTA label hides the button.

**Checkpoint**: US1 is fully functional and shippable as an MVP increment. Further stories are additive.

---

## Phase 4: User Story 2 - Shayley Updates The Three Pathway Cards (Priority: P1)

**Goal**: A tenant admin can edit and reorder the three pathway cards (including uploading new images) from the Admin section and see changes reflected on `/`.

**Independent Test**: Sign in as a tenant admin, open the Pathway Cards editor, upload a new image for card 2, rename card 3, reorder card 3 above card 1, save, reload `/`, and verify image, title, and order all reflect the edit.

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create the image upload handler at `src/app/api/admin/site-content/pathway-cards/upload/route.ts`, mirroring `src/app/api/admin/menu-items/upload/route.ts`: `requireTenantAdmin()`, MIME check (`image/*`), store in bucket `boards` under key `{tenantId}/pathway-cards/{timestamp}-{slug}-{uuid}.{ext}`, return `{ ok: true, imageUrl, path }`.
- [ ] T030 [P] [US2] Create the GET handler at `src/app/api/admin/site-content/pathway-cards/route.ts` that calls `SiteContentService.listPathwayCards(tenant.id)` and fills any missing `displayOrder` slot from `DEFAULT_PATHWAY_CARDS` so the admin always loads three rows to edit.
- [ ] T031 [US2] In the same file `src/app/api/admin/site-content/pathway-cards/route.ts`, add the PATCH handler that parses the body with `pathwayCardsPatchSchema` (exactly 3 cards, `displayOrder` set is `{1,2,3}` with no duplicates), calls `SiteContentService.upsertPathwayCards`, then `revalidateTag("site-content:" + tenant.id)` and `revalidatePath("/")`, returning `{ ok: true, data }` per `contracts/pathway-cards.contract.md`.
- [ ] T032 [US2] Create `src/components/admin/site-content/pathway-cards-manager.tsx` as a client component: renders three card editor blocks, supports per-card image upload button calling the endpoint from T029, supports reordering via up/down buttons that reassign `displayOrder` in form state, blocks "add" and "delete" interactions with an inline message (FR-019), inline validation, `sonner` feedback, submits to PATCH endpoint from T031.
- [ ] T033 [US2] Create `src/app/admin/(shell)/site-content/pathway-cards/page.tsx` as a server component that calls `requireTenantAdmin()`, fetches current cards, and renders `<PathwayCardsManager initialValue={...} />`.
- [ ] T034 [US2] Add a "Site Content → Pathway Cards" nav entry to the admin shell sidebar pointing to `/admin/site-content/pathway-cards`.
- [ ] T035 [US2] Manual QA against acceptance scenarios 1-6 of US2 in `spec.md`: three rows load, image upload sets URL automatically, reorder persists, empty badge hides the chip, bad link target blocks save, cannot add a 4th or delete to two.

**Checkpoint**: US1 and US2 both ship; hero + pathway cards are fully admin-editable.

---

## Phase 5: User Story 3 - Shayley Updates Site-Wide Brand Identity (Priority: P1)

**Goal**: A tenant admin can edit brand name, tagline, primary booking CTA (label + target), and support phone/email from the Admin section; changes propagate to header, footer, and every primary booking CTA across the public site.

**Independent Test**: Sign in as a tenant admin, open Site Configuration, change the booking CTA label, save, walk Home → Menu → Booking, and verify every primary booking CTA shows the new label.

### Implementation for User Story 3

- [ ] T036 [P] [US3] Create the GET handler at `src/app/api/admin/site-content/site-configuration/route.ts` that calls `requireTenantAdmin()` and `SiteContentService.getSiteConfiguration(tenant.id)`, falling back to `DEFAULT_SITE_CONFIGURATION` if the row is missing, returning `{ ok: true, data }` per `contracts/site-configuration.contract.md`.
- [ ] T037 [US3] In the same file `src/app/api/admin/site-content/site-configuration/route.ts`, add the PATCH handler that parses the body with `siteConfigurationPatchSchema`, calls `SiteContentService.upsertSiteConfiguration`, then calls `revalidateTag("site-content:" + tenant.id)`, `revalidatePath("/")`, `revalidatePath("/menu")`, and `revalidatePath("/contact")` so every primary booking CTA picks up the new label.
- [ ] T038 [P] [US3] Create `src/components/admin/site-content/site-configuration-form.tsx` as a client component: controlled form state for all 6 fields, inline email/phone/CTA-target validation, character counts, `sonner` feedback, submits to PATCH endpoint from T037.
- [ ] T039 [US3] Create `src/app/admin/(shell)/site-content/site-configuration/page.tsx` as a server component that calls `requireTenantAdmin()`, fetches the current configuration, and renders `<SiteConfigurationForm initialValue={...} />`.
- [ ] T040 [US3] Add a "Site Content → Site Configuration" nav entry to the admin shell sidebar pointing to `/admin/site-content/site-configuration`.
- [ ] T041 [US3] (Optional hub) Create `src/app/admin/(shell)/site-content/page.tsx` as a simple overview page with three tiles linking to Site Configuration, Hero, and Pathway Cards, so Shayley lands in one place.
- [ ] T042 [US3] Manual QA against acceptance scenarios 1-5 of US3 in `spec.md`: pre-populated form, CTA label edit propagates to every primary booking button across `/`, `/menu`, `/contact`; empty support phone hides the footer block; invalid email blocks save; brand name edit shows in header wordmark and footer brand block.

**Checkpoint**: All three P1 editing surfaces ship. Every primary booking CTA reads from one place (SC-003). Shayley can edit hero, cards, and brand identity without a developer.

---

## Phase 6: User Story 4 - Edits Are Scoped To The Current Tenant (Priority: P1)

**Goal**: Verify that tenant isolation — already enforced by RLS policies from T005 and the `requireTenantAdmin()` + tenant-scoped service calls from T016 / T014 — actually holds end to end.

**Independent Test**: Using two tenants (A and B), edit tenant A's hero/cards/config and confirm tenant B's admin view and public site are unchanged, and that an admin of tenant A cannot read or mutate tenant B's rows via the admin API.

### Verification for User Story 4

- [ ] T043 [US4] Cross-tenant manual QA — admin side: sign in as tenant A admin, edit hero headline and a pathway card title; sign in as tenant B admin and confirm B's hero/cards are the seeded defaults (or B's prior values) and **unchanged** by A's edits. Confirms acceptance scenario 1 of US4.
- [ ] T044 [US4] Cross-tenant manual QA — public side: load tenant A's public home and tenant B's public home; confirm each renders only its own hero/cards/config regardless of which admin you last edited as. Confirms acceptance scenario 3 of US4.
- [ ] T045 [US4] Cross-tenant manual QA — API probing: while authenticated as a tenant A admin, attempt a `PATCH /api/admin/site-content/hero` with a crafted body that tries to write to tenant B's rows (e.g., by spoofing headers or directly hitting the service-role path if exposed). Verify the request is rejected at the route handler (via `getCurrentTenant()` resolving A, not B) and that the service's `tenantId` scoping prevents any cross-write. Confirms acceptance scenario 2 of US4.
- [ ] T046 [US4] Confirm RLS policies block direct Supabase client writes across tenants by running a manual SQL test in the Supabase SQL editor as each tenant admin's auth role: `UPDATE hero_content SET headline = 'hacked' WHERE tenant_id = '<other-tenant>'` must be rejected by RLS.

**Checkpoint**: Tenant isolation holds in DB layer (RLS) and application layer (route + service). Safe to enable additional tenants without content leakage.

---

## Phase 7: User Story 5 - The Home Page Stays Up When Content Is Missing Or Broken (Priority: P2)

**Goal**: Verify the safe-default path delivered by `loadHomePageContent` renders a professional home page when rows are missing or the service throws.

**Independent Test**: Delete a content row (dev only) and/or simulate a service error; reload `/` and confirm it renders fully with default copy, no 500, no blank section.

### Verification for User Story 5

- [ ] T047 [US5] Dev-only QA: delete the `hero_content` row for the local tenant (`DELETE FROM hero_content WHERE tenant_id = '...';`), reload `/`, and confirm the hero renders with `DEFAULT_HERO_CONTENT`. Repeat for `site_configuration` (header/footer fall back) and for removing one `pathway_cards` row (the missing slot renders from `DEFAULT_PATHWAY_CARDS`). Confirms acceptance scenarios 1 and 2 of US5.
- [ ] T048 [US5] Simulate a service throw by temporarily making `getHeroContent` throw (behind a debug env flag) and confirm `loadHomePageContent` catches the error, logs it, and returns defaults so `/` renders rather than 500'ing. Confirms acceptance scenario 3 of US5. Revert the debug flag after verification.
- [ ] T049 [US5] Brand-new-tenant QA: provision a new tenant (via whichever mechanism from spec 009 / 010 is active locally), log in as its admin, and confirm its public home page renders a complete hero + three cards + header/footer out of the box without any edits, demonstrating that the `AFTER INSERT` trigger from T006 seeded content correctly.

**Checkpoint**: Safe defaults proven at every layer; feature is resilient to data-absent and error states.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finalization — regenerate types if anything changed late, run lint/typecheck, and walk `quickstart.md` end-to-end one last time.

- [ ] T050 [P] Run `pnpm typecheck` (or `npm run typecheck`) and fix any type errors introduced by the new service / prop refactor.
- [ ] T051 [P] Run `pnpm lint` (or `npm run lint`) and fix any lint warnings / rule violations in files touched by this feature.
- [ ] T052 Walk `specs/012-admin-editable-hero-and-cards/quickstart.md` end-to-end (steps 1-9) against the local app as a final acceptance gate.
- [ ] T053 Update `CLAUDE.md` with a short note under the multi-tenancy section pointing to `src/services/site-content-service.ts` as the canonical access point for editable home-page content, so future work (Menu editorial blocks, Booking copy, testimonials, events) follows the same pattern.
- [ ] T054 Capture any follow-ups surfaced during QA (e.g., orphaned pathway-card image cleanup, richer text for hero body, drafts/publish workflow) as one-liner notes at the end of `specs/012-admin-editable-hero-and-cards/spec.md` under a new "Follow-ups" section for future specs 013+.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → prerequisite for everything, but essentially scaffolding.
- **Phase 2 (Foundational)** → blocks every user story; delivers US4 and US5 invariants as a side-effect.
- **Phase 3 (US1)**, **Phase 4 (US2)**, **Phase 5 (US3)** → can run in parallel after Phase 2.
- **Phase 6 (US4)** and **Phase 7 (US5)** → verification phases; only meaningful once at least one of US1/US2/US3 has shipped, ideally all three.
- **Phase 8 (Polish)** → after all intended user stories are in.

### User Story Dependencies

- **US1** (Hero): needs Foundational. No dependency on US2 or US3.
- **US2** (Pathway Cards): needs Foundational. No dependency on US1 or US3.
- **US3** (Site Configuration): needs Foundational. Independent of US1 and US2; its effect on CTA buttons relies on the audit done in T022 (Foundational).
- **US4** (Tenant isolation): verification only; RLS and route guard from Foundational are what actually enforce it.
- **US5** (Safe defaults): verification only; `loadHomePageContent` default-filling from Foundational (T013) is what actually enforces it.

### Within Each User Story

- Routes (GET then PATCH, same file) → form component → admin page → nav entry → QA.
- Any two tasks marked `[P]` can be parallelized (different files, no shared state).

### Parallel Opportunities

- Within Foundational: T009, T010 can run in parallel; T018, T019 can run in parallel with each other (both read-only refactors of separate components).
- Across phases 3/4/5: all three P1 stories can be built simultaneously by three developers after Phase 2 is done.
- Within each story: GET handler, form component, and any separate-file work tagged `[P]` can be parallelized.

---

## Parallel Example: After Foundational Phase Completes

```bash
# Three developers start in parallel, one per P1 story:
Developer A: T023 → T024 → T025 → T026 → T027 → T028   # US1 Hero
Developer B: T029 → T030 → T031 → T032 → T033 → T034 → T035   # US2 Pathway Cards
Developer C: T036 → T037 → T038 → T039 → T040 → T041 → T042   # US3 Site Config

# Verification phases happen after all three stories land:
Any developer: T043 → T044 → T045 → T046   # US4 tenant isolation
Any developer: T047 → T048 → T049          # US5 safe defaults
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete **Phase 1** (3 small scaffolding tasks).
2. Complete **Phase 2** (T004-T022). This is the biggest phase — migration, service, refactor.
3. Complete **Phase 3** (US1 hero editing).
4. **STOP and DEMO**: Shayley can now edit her hero without a developer. That alone covers the largest class of copy-change asks.
5. Verify tenant isolation with just T043-T046 even though only US1 is shipped (US4 hinges on Foundational, not on US2/US3 existing).

### Incremental Delivery

1. MVP = Phases 1 + 2 + 3 (US1 hero). Ship.
2. Add **Phase 4** (US2 pathway cards, incl. image upload). Ship.
3. Add **Phase 5** (US3 site configuration — unifies booking CTA label sitewide). Ship.
4. Run **Phases 6 + 7** verification passes. Ship.
5. **Phase 8** polish + follow-up notes. Done.

### Parallel Team Strategy

With three developers after Foundational:

- Dev A: US1 (hero) — Phase 3
- Dev B: US2 (pathway cards + image upload) — Phase 4
- Dev C: US3 (site configuration + sitewide CTA audit) — Phase 5

Phases 6-8 converge all three streams back together.

---

## Notes

- `[P]` tasks = different files, no shared state, no dependency on incomplete tasks.
- `[Story]` label maps the task to the spec.md user story for traceability.
- US4 and US5 are intentionally verification-only phases because their enforcement lives in the Foundational phase. This follows the spec's intent: isolation and resilience are **properties** of the design, not separate features to build.
- No automated tests are scheduled per the "Tests: OPTIONAL" note at the top; all verification is via the QA tasks and `quickstart.md`.
- Commit after each task or logical group so any point in the sequence is revertable. Suggested commit boundaries: after T007 (migration), after T016 (service + auth helper), after T022 (public refactor baseline), after each Phase 3/4/5 GET+PATCH+form trio, after Phase 6, after Phase 7, after Phase 8.
- Avoid: reintroducing hardcoded hex colors in new components (use Tailwind tokens), direct Supabase calls from React components (go through the service), and touching brand theming/fonts (that's spec 005, not this).
