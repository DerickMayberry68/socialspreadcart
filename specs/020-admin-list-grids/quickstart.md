# Quickstart: Admin List Grids

## Preconditions

- Admin user can sign in and access a tenant.
- Tenant has records for contacts, quotes, orders, reviews, events, and menu items.
- At least one list has more than 25 records for pagination checks.

## Manual Verification

1. Open `/admin/contacts`.
2. Confirm contacts render in a grid with visible headers and an actions column.
3. Search for a known contact and confirm the result count changes.
4. Sort Contacts by customer name, status, and created/updated date.
5. Confirm search and status filters remain active after sorting.
6. Confirm closed contacts are muted but still readable.
7. Move to the next page and back, confirming search/filter/sort state remains in the URL.
8. Open `/admin/quotes`, `/admin/orders`, `/admin/reviews`, `/admin/events`, and `/admin/menu-items`.
9. Confirm each list has visible headers, key fields, row actions, and muted completed/inactive rows.
10. Trigger a destructive action on an event or menu item and confirm an in-app confirmation dialog appears before saving.
11. Resize to a mobile width and confirm row data and actions remain usable without overlap.

## Automated Verification Targets

- List-query helper normalizes invalid search, status, sort, direction, and page values.
- Contacts service returns a paged result envelope and preserves tenant scope.
- Shared grid renders sortable headers, sort indicators, row actions, and muted row styles.
- Pagination links preserve active query state.
- Confirmation dialog is used for destructive row actions.

## Regression Checks

- Existing search and status filters still work on Contacts and Quotes.
- Existing order status/delivery decisions still work from Orders.
- Existing review moderation still works from Reviews.
- Existing event and menu item edit/create flows still work.
- No admin page uses browser-native alert, confirm, or prompt dialogs.
