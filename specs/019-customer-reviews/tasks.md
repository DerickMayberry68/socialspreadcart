# Tasks: Customer Reviews And Floating CTA

**Input**: Design documents from `specs/019-customer-reviews/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Tests**: Included because the implementation plan calls for focused service, API route, tenant-isolation, and component tests.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after its phase dependencies are met because it touches different files or only reads shared contracts.
- **[Story]**: Maps the task to the user story in `spec.md`.
- All implementation tasks include exact repository paths.

---

## Phase 1: Setup

**Purpose**: Create the shared review schema, types, validation, and folders needed by every story.

- [x] T001 Create the tenant-scoped `customer_reviews` table, status check constraint, indexes, updated_at trigger, RLS enablement, admin tenant policies, and no raw public select policy in `supabase/migrations/20260522194923_customer_reviews.sql`
- [x] T002 [P] Add customer review domain types, public projection types, and review status union types in `src/lib/types.ts`
- [x] T003 [P] Add public submission, admin moderation, and query validation schemas in `src/lib/validation/review.ts`
- [x] T004 [P] Create the reviews component directory with a placeholder barrel export in `src/components/reviews/index.ts`
- [x] T005 [P] Create the admin reviews component placeholder in `src/components/admin/review-manager.tsx`

---

## Phase 2: Foundational

**Purpose**: Build shared data access and test scaffolding that blocks all user stories.

**CRITICAL**: No user story implementation should start until these tasks are complete.

- [x] T006 Create `ReviewService` with tenant-scoped create, list approved public projection, list admin reviews, and moderate status method stubs in `src/services/review-service.ts`
- [x] T007 [P] Add review service tests for pending-by-default creation, approved-only public projection, private-field exclusion, status transitions, and tenant scoping in `tests/services/review-service.test.ts`
- [x] T008 [P] Add customer review tenant-isolation tests for cross-tenant read and moderation protection in `tests/customer-review-tenant-isolation.test.ts`
- [x] T009 Wire `ReviewService` to Supabase service client patterns used by existing services in `src/services/review-service.ts`
- [x] T010 Add shared review test fixtures and tenant review builders in `tests/helpers/review-test-harness.ts`

**Checkpoint**: Review persistence, validation, and tenant-scoped service behavior are ready for public and admin stories.

---

## Phase 3: User Story 1 - Customer Submits A Review (Priority: P1) MVP

**Goal**: A public visitor can open a clear review entry point, submit a valid review, and receive confirmation that it is pending moderation.

**Independent Test**: From a public page, select Leave a Review, submit valid display name, rating, review text, and optional context, then confirm the review is accepted as pending and not published.

### Tests for User Story 1

- [x] T011 [P] [US1] Add API route tests for `POST /api/reviews` validation, success, pending status, and private-field-safe response in `tests/api/reviews-route.test.ts`
- [x] T012 [P] [US1] Add review form component tests for required field errors, rating selection, successful submit state, and preserved input after handled failure in `tests/components/reviews/review-form.test.tsx`

### Implementation for User Story 1

- [x] T013 [US1] Implement public `POST /api/reviews` route with current tenant resolution, Zod validation, `ReviewService.createPendingReview`, and handled JSON responses in `src/app/api/reviews/route.ts`
- [x] T014 [US1] Implement the customer review form with field-level errors, success state, no browser alerts, and pending-publication copy in `src/components/reviews/review-form.tsx`
- [x] T015 [US1] Add a public reviews submission page that renders the review form and preserves booking access in `src/app/(site)/reviews/page.tsx`
- [x] T016 [US1] Add minimal Leave a Review link support to the floating CTA without changing the Book The Cart destination in `src/components/shared/floating-cta.tsx`
- [x] T017 [US1] Confirm failed review submissions return handled error messages without dropping submitted form text in `src/components/reviews/review-form.tsx`

**Checkpoint**: User Story 1 is independently functional and review submissions stay pending.

---

## Phase 4: User Story 2 - Visitors Read Approved Reviews (Priority: P2)

**Goal**: Public visitors can browse approved reviews in a polished section without exposing private fields.

**Independent Test**: With at least one approved review, view the public reviews section and confirm it shows display name, rating, review text, and occasion only; pending/rejected/hidden reviews do not appear.

### Tests for User Story 2

- [x] T018 [P] [US2] Add API route tests for `GET /api/reviews` approved-only results and private-field exclusion in `tests/api/reviews-route.test.ts`
- [x] T019 [P] [US2] Add reviews section component tests for approved card rendering and empty state rendering in `tests/components/reviews/reviews-section.test.tsx`

### Implementation for User Story 2

- [x] T020 [US2] Implement public `GET /api/reviews` route with current tenant resolution and approved public projection only in `src/app/api/reviews/route.ts`
- [x] T021 [P] [US2] Implement review card display with rating, display name, occasion, and review text only in `src/components/reviews/review-card.tsx`
- [x] T022 [US2] Implement reviews section with polished approved-review layout and empty-state behavior in `src/components/reviews/reviews-section.tsx`
- [x] T023 [US2] Render the approved reviews section on the public home page without exposing private fields in `src/app/(site)/page.tsx`
- [x] T024 [US2] Render approved reviews and the submission form together on the public reviews page in `src/app/(site)/reviews/page.tsx`

**Checkpoint**: User Stories 1 and 2 both work, with unapproved reviews hidden from the public site.

---

## Phase 5: User Story 3 - Admin Reviews And Publishes Submissions (Priority: P3)

**Goal**: Tenant admins can list, approve, reject, hide, restore, and annotate customer reviews for their tenant.

**Independent Test**: Submit a pending review, approve it from admin, refresh the public reviews section, and confirm it appears; reject or hide another review and confirm it stays hidden.

### Tests for User Story 3

- [x] T025 [P] [US3] Add admin review list and status update route tests for `requireTenantAdmin`, tenant scoping, status filtering, and invalid transition handling in `tests/api/admin-reviews-route.test.ts`
- [x] T026 [P] [US3] Add review manager component tests for filter tabs, approve, reject, hide, restore, admin note editing, and toast/handled error states in `tests/components/admin/review-manager.test.tsx`

### Implementation for User Story 3

- [x] T027 [US3] Implement guarded admin review list route with `requireTenantAdmin()` as the first operation in `src/app/api/admin/reviews/route.ts`
- [x] T028 [US3] Implement guarded admin review status update route with `requireTenantAdmin()` as the first operation in `src/app/api/admin/reviews/[id]/status/route.ts`
- [x] T029 [US3] Implement review manager UI with pending-first filters, review details, moderation buttons, private note editing, toasts, and handled errors in `src/components/admin/review-manager.tsx`
- [x] T030 [US3] Add the admin reviews page that loads tenant-scoped reviews and renders `ReviewManager` in `src/app/admin/(shell)/reviews/page.tsx`
- [x] T031 [US3] Add Reviews to the admin shell navigation with a clear label and current route styling in `src/app/admin/(shell)/layout.tsx`
- [x] T032 [US3] Ensure approval, rejection, hidden, and restore metadata are written by `ReviewService` without leaking across tenants in `src/services/review-service.ts`

**Checkpoint**: Admin moderation works and approved reviews appear publicly after refresh.

---

## Phase 6: User Story 4 - Simplify Public Navigation And Floating Actions (Priority: P4)

**Goal**: Public navigation no longer shows Contact, while Leave a Review appears above Book The Cart as a consistent floating action.

**Independent Test**: On desktop and mobile public pages, confirm Contact is absent from the header, `/contact` still works directly, footer contact details still show, and both floating buttons are visible and non-overlapping.

### Tests for User Story 4

- [x] T033 [P] [US4] Add site header tests proving Contact is absent while expected public nav items remain in `tests/components/site-header.test.tsx`
- [x] T034 [P] [US4] Add floating CTA tests for stacked Leave a Review and Book The Cart actions, labels, and hrefs in `tests/components/shared/floating-cta.test.tsx`

### Implementation for User Story 4

- [x] T035 [US4] Remove Contact from default public header navigation while preserving direct `/contact` and footer paths in `src/components/shared/site-header.tsx`
- [x] T036 [US4] Update shell content defaults so persisted/default public navigation excludes Contact in `src/lib/site.ts`
- [x] T037 [US4] Add a tenant-safe migration to remove Contact from existing saved shell navigation records without deleting the Contact page in `supabase/migrations/20260522195053_remove_contact_from_header_navigation.sql`
- [x] T038 [US4] Finalize stacked floating action styling, focus behavior, responsive spacing, and non-overlap behavior in `src/components/shared/floating-cta.tsx`
- [x] T039 [US4] Verify public layout still renders the Contact page, quote form links, footer details, and Book The Cart pathway in `src/app/(site)/layout.tsx`

**Checkpoint**: Header navigation is simplified and both floating actions work across public pages.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full feature, harden edge cases, and prepare for review.

- [x] T040 [P] Add duplicate-submission guard coverage for same tenant, same display name, same review body, and recent submission window in `tests/services/review-service.test.ts`
- [x] T041 Add duplicate-submission guard implementation or normalization hook in `src/services/review-service.ts`
- [x] T042 [P] Add loading, disabled, and accessible focus states for review submission and moderation controls in `src/components/reviews/review-form.tsx`
- [x] T043 [P] Add responsive card/grid refinements for public reviews section in `src/components/reviews/reviews-section.tsx`
- [x] T044 Run implementation validation commands from `specs/019-customer-reviews/quickstart.md`: `npm test` and `npx tsc --noEmit`
- [ ] T045 Run manual acceptance checks for public submission, admin moderation, rejection/hidden states, navigation removal, and floating action layout from `specs/019-customer-reviews/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2.
- **Phase 4 US2**: Depends on Phase 2; integrates naturally after US1 but approved-review display can be tested with seeded data.
- **Phase 5 US3**: Depends on Phase 2; public display validation is strongest after US2.
- **Phase 6 US4**: Depends on Phase 2; may be implemented after US1 to avoid repeated `FloatingCta` conflicts.
- **Phase 7 Polish**: Depends on the selected user stories being complete.

### User Story Dependencies

- **US1 Customer Submits A Review**: MVP; no dependency on other stories after foundation.
- **US2 Visitors Read Approved Reviews**: Can be built with seeded approved data; complements US1.
- **US3 Admin Reviews And Publishes Submissions**: Can list/moderate seeded data; public visibility verification benefits from US2.
- **US4 Simplify Public Navigation And Floating Actions**: Can be built independently, but shares `FloatingCta` with US1.

### Parallel Opportunities

- T002, T003, T004, and T005 can run in parallel after T001 is started if the schema names are stable.
- T007, T008, and T010 can run in parallel while T006 defines the service surface.
- T011 and T012 can run in parallel for US1.
- T018 and T019 can run in parallel for US2.
- T025 and T026 can run in parallel for US3.
- T033 and T034 can run in parallel for US4.
- T040, T042, and T043 can run in parallel during polish.

---

## Parallel Example: User Story 1

```text
Task: "T011 [P] [US1] Add API route tests for POST /api/reviews validation, success, pending status, and private-field-safe response in tests/api/reviews-route.test.ts"
Task: "T012 [P] [US1] Add review form component tests for required field errors, rating selection, successful submit state, and preserved input after handled failure in tests/components/reviews/review-form.test.tsx"
```

---

## Parallel Example: User Story 3

```text
Task: "T025 [P] [US3] Add admin review list and status update route tests for requireTenantAdmin, tenant scoping, status filtering, and invalid transition handling in tests/api/admin-reviews-route.test.ts"
Task: "T026 [P] [US3] Add review manager component tests for filter tabs, approve, reject, hide, restore, admin note editing, and toast/handled error states in tests/components/admin/review-manager.test.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for public review submission.
3. Validate that submissions are accepted, pending, and not publicly visible.
4. Stop for review or continue to public display and moderation.

### Incremental Delivery

1. Ship US1 to collect pending reviews.
2. Add US2 to display approved reviews only.
3. Add US3 so admins can moderate without developer help.
4. Add US4 to complete the navigation and floating action request.
5. Run Phase 7 validation before release.

### Notes

- Use `ReviewService` for all review persistence and reads.
- Do not read or write review records directly from components or pages.
- Admin review API routes must call `requireTenantAdmin()` first and short-circuit guard errors.
- Do not expose `customer_email`, `customer_phone`, `admin_note`, or admin metadata in public responses.
- Do not use `window.alert`, `window.confirm`, or `window.prompt`.
