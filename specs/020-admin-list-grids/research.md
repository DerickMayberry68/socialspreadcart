# Research: Admin List Grids

## Decision: Use URL-backed query state for search, filters, sort, direction, and page

**Rationale**: Contacts and Quotes already use GET query parameters for search/status filters. Extending that pattern keeps browser refresh, back/forward navigation, shared links, and server-rendered pages predictable.

**Alternatives considered**:
- Client-only state: faster to add but loses shareable URLs and can reload all records.
- Session storage: unnecessary persistence layer and harder to reason about.

## Decision: Add shared list-query parsing and URL builders

**Rationale**: Every in-scope list needs the same small set of controls. A pure helper can clamp invalid pages, normalize sort direction, preserve existing search/filter params, and keep page components small.

**Alternatives considered**:
- Inline parsing in each page: simpler for one page but duplicates edge-case handling across six lists.
- A broad admin list service: violates interface segregation by mixing unrelated domains.

## Decision: Use a common paged-result envelope from services

**Rationale**: Pagination controls need total matching count, current page, page size, and records. Returning a common envelope lets pages render consistent counts and controls without guessing from the current array length.

**Alternatives considered**:
- Return only arrays and count separately: creates duplicate service calls and increases mismatch risk.
- Fetch unbounded arrays and paginate in the component: not appropriate for operational data growth.

## Decision: Contacts define the first production slice

**Rationale**: Contacts were the user's specific example and currently have the clearest gap: card rows with no sortable headers. Implementing Contacts first proves the query, grid, muted row, and pagination pattern before expanding to other lists.

**Alternatives considered**:
- Convert all lists at once: higher regression risk and harder to verify.
- Start with Orders: more complex due to delivery/payment actions and less useful as the first pattern.

## Decision: Use safe row actions based on record type

**Rationale**: The user asked for Edit and Delete, but not every domain should hard-delete records. Events and Menu Items already have edit/delete style management; Reviews can approve/reject/hide; Orders likely need open/status/cancel rather than hard delete; Quotes/Contacts may need open/edit/status and a safe close/archive if deletion is not already supported.

**Alternatives considered**:
- Add hard delete everywhere: risky for financial/order/contact history.
- Hide actions until detail pages: preserves current behavior but does not meet the row-action requirement.

## Decision: Responsive grid can become stacked rows on small screens

**Rationale**: Dense admin tables need column headers on desktop, but small screens should avoid clipped columns and inaccessible actions. A responsive table/list hybrid can preserve data visibility and actions.

**Alternatives considered**:
- Force horizontal scroll everywhere: acceptable for orders with many columns, but poor as the default pattern for contacts and quotes.
- Hide low-priority fields: conflicts with the requirement that information be easily visible.
