# Tasks: Admin About Content

**Input**: Design documents from `specs/013-admin-about-content/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Automated regression commands are included in the final phase. Story-level tests are manual QA because the current feature spec requests verifiable admin/public workflows, not TDD.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared schema, fallbacks, and types used by all About stories.

- [X] T001 Create About content migration in supabase/migrations/20260425000000_admin_about_content.sql
- [X] T002 [P] Add About fallback copy, image, and card defaults in src/lib/fallback-data.ts
- [X] T003 [P] Add About content domain types in src/lib/types/site-content.ts
- [X] T004 [P] Add About validation schemas in src/lib/validation/site-content.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core service and route infrastructure required before user stories.

- [X] T005 Extend src/services/site-content-service.ts with About fallback helpers and loadAboutPageContent
- [X] T006 Extend src/services/site-content-service.ts with updateAboutContent and About cache invalidation
- [X] T007 Add admin About GET/PATCH route in src/app/api/admin/site-content/about/route.ts
- [X] T008 Add admin About upload route in src/app/api/admin/site-content/about/upload/route.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Edit About Page Copy (Priority: P1) MVP

**Goal**: Client admin can edit About heading and story copy and see it on the public About page.

**Independent Test**: Sign in as a tenant admin, change About copy at `/admin/site-content/about`, save, and confirm `/about` displays the saved words.

- [X] T009 [US1] Create admin About route page in src/app/admin/(shell)/site-content/about/page.tsx
- [X] T010 [US1] Create AboutManager content-copy editor in src/components/admin/site-content/about-manager.tsx
- [X] T011 [US1] Add About card to Site Content index in src/app/admin/(shell)/site-content/page.tsx
- [X] T012 [US1] Refactor public About page to load About copy from SiteContentService in src/app/(site)/about/page.tsx
- [X] T013 [US1] Wire handled error modal and success toast behavior in src/components/admin/site-content/about-manager.tsx
- [ ] T014 [US1] Mark User Story 1 manual QA complete in specs/013-admin-about-content/tasks.md after verifying copy save and public rendering

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Manage About Page Images (Priority: P2)

**Goal**: Client admin can replace About page images and required descriptive text.

**Independent Test**: Upload or enter an About image with alt text, save, and confirm `/about` displays it without broken placeholders.

- [X] T015 [US2] Add image editing state and controls to src/components/admin/site-content/about-manager.tsx
- [X] T016 [US2] Add About image upload integration to src/components/admin/site-content/about-manager.tsx
- [X] T017 [US2] Render ordered About images from service data in src/app/(site)/about/page.tsx
- [X] T018 [US2] Ensure failed uploads and invalid image data show modal alerts in src/components/admin/site-content/about-manager.tsx
- [ ] T019 [US2] Mark User Story 2 manual QA complete in specs/013-admin-about-content/tasks.md after verifying upload, replacement, invalid upload, and public rendering

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Edit About Feature Cards (Priority: P3)

**Goal**: Client admin can edit the three About feature card titles and body copy.

**Independent Test**: Edit all three cards, save, and confirm `/about` displays the saved card content in the expected positions.

- [X] T020 [US3] Add feature card editing state and controls to src/components/admin/site-content/about-manager.tsx
- [X] T021 [US3] Render saved About feature cards with existing icons in src/app/(site)/about/page.tsx
- [X] T022 [US3] Validate exactly three feature cards in src/lib/validation/site-content.ts
- [ ] T023 [US3] Mark User Story 3 manual QA complete in specs/013-admin-about-content/tasks.md after verifying card edits and invalid card errors

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, docs, and deployment confidence.

- [X] T024 [P] Update specs/013-admin-about-content/quickstart.md with any implementation path changes discovered during build
- [X] T025 Run npx tsc --noEmit and fix any TypeScript issues
- [X] T026 Run npm run lint and fix any lint issues
- [X] T027 Run npm test and fix any regression failures
- [X] T028 Run npm run build and fix any production build issues
- [X] T029 Verify checklist status in specs/013-admin-about-content/checklists/requirements.md
- [ ] T030 Perform final mobile and desktop visual review of /admin/site-content/about and /about

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and integrates with AboutManager from US1.
- **User Story 3 (Phase 5)**: Depends on Foundational and integrates with AboutManager from US1.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### Parallel Opportunities

- T002, T003, and T004 can be done in parallel after T001 is understood.
- T009 and T011 can be done while T010 is drafted, but final wiring depends on T010.
- T017 can be done after service data exists and does not require upload UI to be finished.
- T024 can be updated independently during final polish.

### Parallel Example: User Story 2

```text
Task: "Add image editing state and controls to src/components/admin/site-content/about-manager.tsx"
Task: "Render ordered About images from service data in src/app/(site)/about/page.tsx"
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational tasks.
2. Complete User Story 1.
3. Validate copy save and public About rendering.

### Incremental Delivery

1. Add editable About copy.
2. Add About image management.
3. Add About feature card editing.
4. Validate all flows and run automated checks.
