# Feature Specification: Admin List Grids

**Feature Branch**: `020-admin-list-grids`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "In the admin section the List of contacts(and others) need to be grids with headers so they can be sorted. We already have a search so that is good. We need the information in the grid easily visible, we can even gray out the closed entries maybe and put action buttons to Edit and Delete. And add paging."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan Contacts In A Sortable Grid (Priority: P1)

As an admin managing leads, I can view contacts in a dense grid with visible column headers, sort the list by important fields, and keep existing search and status filters.

**Why this priority**: Contacts are the primary example called out by the user and currently use a card list that makes side-by-side comparison harder.

**Independent Test**: Open Admin Contacts with enough records to compare, search by customer text, sort by name, status, source, or created date, and confirm the grid remains readable with the same filtered records.

**Acceptance Scenarios**:

1. **Given** contacts exist, **When** an admin opens the Contacts page, **Then** contacts appear in a grid with labeled headers for customer, contact details, source, status, created/updated timing, and actions.
2. **Given** contacts are filtered by search or status, **When** the admin sorts a column, **Then** the page keeps the active filters while reordering the matching contacts.
3. **Given** a contact is closed, **When** the contact appears in the grid, **Then** the row is visually muted while still readable and actionable.

---

### User Story 2 - Use Consistent Admin Grids Across Operational Lists (Priority: P2)

As an admin moving between sections, I can use the same grid pattern for quotes, orders, reviews, events, and menu items so each list has clear columns, consistent actions, and predictable controls.

**Why this priority**: The issue is not isolated to contacts; the admin area needs a consistent operational list pattern.

**Independent Test**: Open each primary admin list and confirm it uses a header-based grid, exposes the most important fields without opening every record, and presents row actions in a consistent location.

**Acceptance Scenarios**:

1. **Given** records exist in Quotes, Orders, Reviews, Events, or Menu Items, **When** the admin opens that page, **Then** the record list appears as a grid or table with visible headers and row actions.
2. **Given** a record is closed, lost, hidden, inactive, fulfilled, cancelled, or past-dated, **When** it appears in a grid, **Then** the row uses a muted visual treatment that does not remove readability or actions.
3. **Given** a list has existing search or status filters, **When** the grid pattern is applied, **Then** the existing search/filter workflow remains available.

---

### User Story 3 - Page Through Large Lists (Priority: P3)

As an admin with many records, I can page through list results without losing search, filter, or sort state.

**Why this priority**: Paging prevents long admin pages from becoming hard to scan as production data grows.

**Independent Test**: Seed or view a list with more records than the default page size, move between pages, change sorting, and confirm the displayed count and controls match the current result set.

**Acceptance Scenarios**:

1. **Given** a list has more records than one page, **When** the admin reaches the list, **Then** pagination controls show the current page and allow moving forward and backward.
2. **Given** the admin has applied search, filters, or sorting, **When** they move to another page, **Then** those controls remain active.
3. **Given** a search or filter reduces the total result count, **When** the result count no longer includes the current page, **Then** the admin is returned to the first valid page.

---

### Edge Cases

- Empty lists still show a useful empty state instead of a blank grid.
- Sorting a column with missing values keeps records visible and places missing values consistently.
- Mobile screens must preserve all row information through a responsive table or stacked row layout without clipping actions.
- Destructive actions must require a deliberate confirmation step and must not rely on browser alert, confirm, or prompt dialogs.
- The grid must handle long names, long emails, long addresses, and long review text without breaking layout.
- Paging controls must handle first page, last page, and single-page result sets without disabled controls looking actionable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Admin Contacts MUST display records in a grid with visible column headers and a dedicated actions column.
- **FR-002**: Admin Contacts MUST support sorting by customer name, email or primary contact detail, source, status, and created or updated date.
- **FR-003**: Existing search and status filtering on Contacts and Quotes MUST remain available and MUST be preserved when sorting or paging.
- **FR-004**: Admin Quotes, Orders, Reviews, Events, and Menu Items MUST use a consistent grid/list-table pattern with visible headers and row-level actions.
- **FR-005**: Each in-scope grid MUST show the most important identifying fields directly in the row so admins can decide what to open or act on without entering detail pages.
- **FR-006**: Closed, lost, hidden, inactive, fulfilled, cancelled, or past records MUST be visually muted while keeping text readable and actions accessible.
- **FR-007**: Each row MUST expose clear actions appropriate to the record type, including edit/open where applicable and delete/remove/archive where safe for that record type.
- **FR-008**: Destructive row actions MUST include a deliberate confirmation experience before the action is completed.
- **FR-009**: Lists MUST support pagination with a default page size suitable for admin scanning, assumed to be 25 records per page unless planning identifies a better project standard.
- **FR-010**: Pagination MUST preserve active search, status filters, sort column, and sort direction.
- **FR-011**: Grid headers used for sorting MUST clearly communicate current sort column and direction.
- **FR-012**: Result counts MUST distinguish between total matching results and the number currently shown on the page.
- **FR-013**: Mobile and narrow layouts MUST keep row information and actions usable without horizontal overlap or hidden essential fields.
- **FR-014**: Empty states MUST remain clear and specific to the current filters or search.
- **FR-015**: Tenant boundaries and existing admin permissions MUST remain unchanged; admins must only see and act on records for the active tenant.

### Key Entities *(include if feature involves data)*

- **Admin List View**: A tenant-scoped collection of records shown in an admin section, including its visible columns, supported filters, sort state, page state, and result counts.
- **Grid Row Action**: A record-level operation such as open, edit, approve, hide, archive, delete, or status change. Actions vary by record type and must respect existing business rules.
- **Record State**: The business status that determines row emphasis, including open/active states and muted states such as closed, lost, hidden, inactive, fulfilled, cancelled, or past.
- **Pagination State**: Current page, page size, total matching results, active filters, and active sort.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can identify a contact's name, contact method, source, status, and available actions from the Contacts list in under 10 seconds without opening the contact detail page.
- **SC-002**: Sorting any supported Contacts column reorders the list while preserving filters and completes without losing the admin's current view state.
- **SC-003**: Each primary operational admin list presents a consistent header-and-actions pattern so admins do not need to relearn controls between sections.
- **SC-004**: Lists with more than 25 matching records can be navigated with paging while preserving search, filters, and sort state.
- **SC-005**: Closed or inactive records are visually distinguishable from active records in every in-scope list without hiding key text or row actions.
- **SC-006**: No destructive action can be completed from a list row without a confirmation step.

## Assumptions

- Primary operational lists in scope are Contacts, Quotes, Orders, Reviews, Events, and Menu Items.
- Site content editors are out of scope unless they already render a record list comparable to the operational lists.
- Contacts are the first implementation target and define the minimum acceptable grid behavior.
- Delete behavior should follow existing product safety rules; where hard deletion is inappropriate, the visible action may be archive, hide, cancel, or close instead.
- Existing authentication, tenant scoping, and role rules remain in force.
