# Tasks: Editable Marketing Pages

**Input**: Design documents from `specs/014-editable-marketing-pages/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Automated regression commands are included in the final phase. Story-level tests are manual QA because the current request prioritizes admin/public workflow completion.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared storage, types, defaults, and validation for editable page content.

- [X] T001 Create marketing page content migration in `supabase/migrations/*_marketing_page_content.sql`
- [X] T002 [P] Add page content defaults in `src/lib/page-content-defaults.ts`
- [X] T003 [P] Extend page content types in `src/lib/types/site-content.ts`
- [X] T004 [P] Extend page content validation in `src/lib/validation/site-content.ts`

---

## Phase 2: Foundational

**Purpose**: Service and API infrastructure required for all page editors.

- [X] T005 Extend `src/services/site-content-service.ts` with marketing page content read/write helpers
- [X] T006 Add admin page content route in `src/app/api/admin/site-content/page-content/[pageKey]/route.ts`
- [X] T007 Add reusable admin page content form in `src/components/admin/site-content/page-content-form.tsx`
- [X] T008 Add page editor routes/cards under `src/app/admin/(shell)/site-content`

---

## Phase 3: User Story 1 - Shared Site Shell Content (Priority: P1)

**Goal**: Shayley can edit shared header/footer/navigation/contact/social content.

**Independent Test**: Save shell content and confirm it appears across all main public pages.

- [X] T009 [US1] Add shell page defaults/schema fields in `src/lib/page-content-defaults.ts` and `src/lib/validation/site-content.ts`
- [X] T010 [US1] Add shell editor page in `src/app/admin/(shell)/site-content/shell/page.tsx`
- [X] T011 [US1] Refactor `src/app/(site)/layout.tsx`, `src/components/shared/site-header.tsx`, and `src/components/shared/site-footer.tsx` to consume shell content
- [ ] T012 [US1] Mark shared shell manual QA complete after verifying all public pages

---

## Phase 4: User Story 2 - Remaining Home Page Content (Priority: P2)

**Goal**: Shayley can edit remaining Home page copy and image fields not covered by hero/pathway editors.

**Independent Test**: Save Home page content and confirm `/` renders saved copy/images while hero/pathway still work.

- [X] T013 [US2] Add Home page defaults/schema in `src/lib/page-content-defaults.ts` and `src/lib/validation/site-content.ts`
- [X] T014 [US2] Add Home content editor page in `src/app/admin/(shell)/site-content/home/page.tsx`
- [X] T015 [US2] Refactor `src/app/(site)/page.tsx` and `src/components/sections/home-page.tsx` to consume editable Home page content
- [ ] T016 [US2] Mark Home manual QA complete after verifying saved and fallback states

---

## Phase 5: User Story 3 - Menu, Events, Cart Service, Contact Page Content (Priority: P3)

**Goal**: Shayley can edit page-level copy and images for remaining operational/marketing pages.

**Independent Test**: Save each page editor and confirm its public route renders saved content without breaking operational records.

- [X] T017 [US3] Add Menu page editor and refactor `src/app/(site)/menu/page.tsx`
- [X] T018 [US3] Add Events page editor and refactor `src/app/(site)/events/page.tsx`
- [X] T019 [US3] Add Cart Service page editor and refactor `src/app/(site)/cart-service/page.tsx`
- [X] T020 [US3] Add Contact page editor and refactor `src/app/(site)/contact/page.tsx`
- [ ] T021 [US3] Mark page-level manual QA complete after verifying all four pages

---

## Phase 6: User Story 4 - Gallery And About Coverage Audit (Priority: P4)

**Goal**: Ensure existing Gallery and About editors cover every visible copy/image field.

- [X] T022 [US4] Audit `src/app/(site)/gallery/page.tsx` against `src/components/admin/site-content/gallery-manager.tsx`
- [X] T023 [US4] Audit `src/app/(site)/about/page.tsx` against `src/components/admin/site-content/about-manager.tsx`
- [ ] T024 [US4] Fill any discovered Gallery/About copy or image gaps

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T025 Run `npx tsc --noEmit` and fix TypeScript issues
- [X] T026 Run `npm run lint` and fix lint issues
- [ ] T027 Run `npm test` and fix regression failures
- [X] T028 Run `npm run build` if earlier checks pass
- [X] T029 Update `specs/014-editable-marketing-pages/tasks.md` checkboxes for completed work

## Dependencies & Execution Order

- Phase 1 blocks all implementation.
- Phase 2 blocks all public page refactors.
- US1 should land before US2/US3 because shared shell content changes affect all pages.
- US2 and US3 can proceed independently after Phase 2.
- US4 is an audit/polish phase and can run once the main editors are complete.
