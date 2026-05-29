# Tasks: Admin List Grids

**Input**: Design documents from `/specs/020-admin-list-grids/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included because the feature spec defines automated verification targets and this change affects shared admin workflows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared query/grid primitives used by all admin list pages.

- [x] T001 Create `src/lib/admin/list-query.ts` with typed list query parsing, default page size, sort direction normalization, page clamping, and URL param builders
- [x] T002 Create `src/components/admin/admin-data-grid.tsx` with configurable columns, sortable headers, row state styling, responsive row rendering, and row actions
- [x] T003 Create `src/components/admin/admin-pagination.tsx` with previous/next/page links that preserve active query parameters
- [x] T004 Create `src/components/admin/delete-confirmation-dialog.tsx` using the existing Radix dialog pattern and no browser-native dialogs
- [x] T005 [P] Add unit coverage for list query normalization and URL preservation in `tests/admin-list-query.test.ts`
- [x] T006 [P] Add component coverage for sortable headers, muted rows, and action rendering in `tests/components/admin/admin-data-grid.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared service result contracts and make the first domain service ready for grid usage.

**Critical**: No user story work should begin until this phase is complete.

- [x] T007 Add shared `AdminListQuery`, `PagedResult`, and sort direction types in `src/lib/types.ts`
- [x] T008 Extend `ContactService.listContacts` in `src/services/contact-service.ts` to accept typed search/status/sort/direction/page options and return `PagedResult<Contact>`
- [ ] T009 [P] Add service coverage for contact pagination, tenant scoping, sorting, and filtering in `tests/services/contact-service.test.ts`
- [x] T010 Update existing contact count callers in `src/app/admin/(shell)/contacts/page.tsx` and `src/app/admin/(shell)/page.tsx` so they continue to work with the new contact service contract

**Checkpoint**: Shared grid/query primitives exist and Contacts service can provide paged grid data.

---

## Phase 3: User Story 1 - Scan Contacts In A Sortable Grid (Priority: P1) MVP

**Goal**: Contacts render as a sortable, paginated admin grid with visible headers, preserved search/status filters, muted closed rows, and explicit row actions.

**Independent Test**: Open `/admin/contacts`, search/filter contacts, sort supported columns, page through results, and confirm closed rows remain readable but visually muted.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add Contacts page rendering coverage for grid headers, result count, muted closed rows, and action links in `tests/components/admin/contacts-page-grid.test.tsx`
- [x] T012 [P] [US1] Add pagination URL preservation coverage for Contacts query combinations in `tests/admin-list-query.test.ts`

### Implementation for User Story 1

- [x] T013 [US1] Refactor `src/app/admin/(shell)/contacts/page.tsx` to use `AdminDataGrid`, `AdminPagination`, and the paged `ContactService.listContacts` result
- [x] T014 [US1] Add sortable Contacts header links for customer, email, source, status, and created/updated date in `src/app/admin/(shell)/contacts/page.tsx`
- [x] T015 [US1] Add Contacts row actions for open/edit and safe close/archive/delete affordance as supported by existing contact behavior in `src/app/admin/(shell)/contacts/page.tsx`
- [x] T016 [US1] Ensure Contacts search/status filter submissions reset `page` to 1 while preserving explicit sort state in `src/app/admin/(shell)/contacts/page.tsx`
- [x] T017 [US1] Run and fix `tests/admin-list-query.test.ts`, `tests/services/contact-service.test.ts`, and `tests/components/admin/contacts-page-grid.test.tsx`

**Checkpoint**: Contacts grid is fully functional and testable independently.

---

## Phase 4: User Story 2 - Use Consistent Admin Grids Across Operational Lists (Priority: P2)

**Goal**: Quotes, Orders, Reviews, Events, and Menu Items use the same visible-header grid/list-table pattern with key fields, muted completed/inactive states, and explicit row actions.

**Independent Test**: Open each in-scope admin page and confirm it uses visible headers, readable rows, row actions, and muted completed/inactive rows without breaking existing workflows.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add or update Quotes grid coverage in `tests/components/admin/quotes-page-grid.test.tsx`
- [x] T019 [P] [US2] Update Orders manager grid coverage in `tests/components/admin/order-manager.test.tsx`
- [x] T020 [P] [US2] Update Reviews manager grid coverage in `tests/components/admin/review-manager.test.tsx`
- [ ] T021 [P] [US2] Add Events manager grid coverage in `tests/components/admin/event-manager.test.tsx`
- [ ] T022 [P] [US2] Add Menu Items manager grid coverage in `tests/components/admin/menu-item-manager.test.tsx`

### Implementation for User Story 2

- [x] T023 [US2] Extend `listQuotes` in `src/services/quote-service.ts` to support typed sort/page options and return a paged result for admin quote lists
- [x] T024 [US2] Refactor `src/app/admin/(shell)/quotes/page.tsx` to use `AdminDataGrid`, `AdminPagination`, sortable headers, and muted closed/lost rows
- [x] T025 [US2] Refactor `src/components/admin/order-manager.tsx` to use the shared grid header/action pattern while preserving order status and delivery decision actions
- [x] T026 [US2] Extend `ReviewService.listAdminReviews` in `src/services/review-service.ts` to support typed status/sort/page options and return a paged result for admin review lists
- [x] T027 [US2] Refactor `src/app/admin/(shell)/reviews/page.tsx` and `src/components/admin/review-manager.tsx` to use the shared grid pattern with muted rejected/hidden rows
- [x] T028 [US2] Refactor `src/components/admin/event-manager.tsx` scheduled events list to use the shared grid pattern with muted past rows and existing edit/delete actions
- [x] T029 [US2] Refactor `src/components/admin/menu-item-manager.tsx` current menu items list to use the shared grid pattern with muted inactive rows and existing visibility/edit/delete actions
- [x] T030 [US2] Replace event and menu item delete flows with `DeleteConfirmationDialog` in `src/components/admin/event-manager.tsx` and `src/components/admin/menu-item-manager.tsx`
- [x] T031 [US2] Run and fix admin component tests for quotes, orders, reviews, events, and menu items

**Checkpoint**: All operational admin lists share the grid pattern and keep their existing domain actions.

---

## Phase 5: User Story 3 - Page Through Large Lists (Priority: P3)

**Goal**: Large admin lists support paging without losing search, filter, or sort state.

**Independent Test**: Use records beyond the default page size, navigate between pages, change sort/filter values, and confirm URL state and result counts remain correct.

### Tests for User Story 3

- [x] T032 [P] [US3] Add pagination component coverage for first, middle, last, and single-page states in `tests/components/admin/admin-pagination.test.tsx`
- [ ] T033 [P] [US3] Add review service pagination coverage in `tests/services/review-service.test.ts`
- [ ] T034 [P] [US3] Add quote service pagination coverage in `tests/services/quote-service.test.ts`

### Implementation for User Story 3

- [x] T035 [US3] Add `AdminPagination` to Contacts, Quotes, and Reviews pages in `src/app/admin/(shell)/contacts/page.tsx`, `src/app/admin/(shell)/quotes/page.tsx`, and `src/app/admin/(shell)/reviews/page.tsx`
- [x] T036 [US3] Add current-page and total-matching result copy to Contacts, Quotes, and Reviews in `src/app/admin/(shell)/contacts/page.tsx`, `src/app/admin/(shell)/quotes/page.tsx`, and `src/app/admin/(shell)/reviews/page.tsx`
- [x] T037 [US3] Add local paging controls for Events and Menu Items in `src/components/admin/event-manager.tsx` and `src/components/admin/menu-item-manager.tsx` if their loaded record count exceeds the default page size
- [x] T038 [US3] Add order paging support in `src/services/order-service.ts`, `src/app/admin/(shell)/orders/page.tsx`, and `src/components/admin/order-manager.tsx`
- [x] T039 [US3] Run and fix pagination tests across list-query, pagination component, quote service, review service, and order manager coverage

**Checkpoint**: In-scope lists can page through larger result sets while preserving active view state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, accessibility, and regression hardening.

- [x] T040 [P] Verify no admin list implementation uses `window.alert`, `window.confirm`, or `window.prompt` by searching `src/app/admin` and `src/components/admin`
- [ ] T041 [P] Verify responsive behavior for Contacts, Quotes, Orders, Reviews, Events, and Menu Items in a browser at desktop and mobile widths
- [x] T042 [P] Review grid action labels and visible copy for plain operator language in `src/app/admin/(shell)` and `src/components/admin`
- [x] T043 Run `npx vitest run tests/admin-list-query.test.ts tests/components/admin tests/services/contact-service.test.ts tests/services/quote-service.test.ts tests/services/review-service.test.ts`
- [x] T044 Run `npx tsc --noEmit`
- [x] T045 Run `npm run build`
- [ ] T046 Complete quickstart validation from `specs/020-admin-list-grids/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on foundational work and is the MVP.
- **User Story 2 (Phase 4)**: Can begin after foundational work, but should reuse the proven Contacts grid pattern from US1 where possible.
- **User Story 3 (Phase 5)**: Depends on the grid/service patterns from US1 and US2.
- **Polish (Phase 6)**: Depends on all selected user stories.

### User Story Dependencies

- **US1**: No dependency on other stories after foundation.
- **US2**: Can be implemented independently per page after foundation, but design consistency improves if US1 lands first.
- **US3**: Depends on the paged-result and query-state contracts from foundation and the page migrations from US1/US2.

### Parallel Opportunities

- T005 and T006 can run in parallel after T001-T003 are drafted.
- T011 and T012 can run in parallel.
- T018 through T022 can run in parallel because they target different test files.
- T023 through T029 can be split by admin area after the shared grid pattern is stable.
- T032 through T034 can run in parallel.
- T040 through T042 can run in parallel during polish.

---

## Parallel Example: User Story 2

```text
Task: "Add or update Quotes grid coverage in tests/components/admin/quotes-page-grid.test.tsx"
Task: "Update Orders manager grid coverage in tests/components/admin/order-manager.test.tsx"
Task: "Update Reviews manager grid coverage in tests/components/admin/review-manager.test.tsx"
Task: "Add Events manager grid coverage in tests/components/admin/event-manager.test.tsx"
Task: "Add Menu Items manager grid coverage in tests/components/admin/menu-item-manager.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete shared query/grid setup.
2. Complete Contacts service paging/sorting foundation.
3. Convert Contacts to the grid.
4. Validate Contacts independently before expanding the pattern.

### Incremental Delivery

1. Contacts grid MVP.
2. Quotes grid because it already has partial headers and similar filters.
3. Reviews and Orders because they have more actions and moderation/status behavior.
4. Events and Menu Items because they are client-managed editing lists.
5. Pagination hardening across all pages.

### Notes

- Do not add database migrations unless implementation discovers an unavoidable missing column or index.
- Preserve tenant scoping and existing role checks.
- Keep hard delete out of orders unless product rules explicitly allow it.
- Use Radix-style confirmation dialogs for destructive row actions.
