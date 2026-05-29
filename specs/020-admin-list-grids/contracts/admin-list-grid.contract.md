# UI Contract: Admin List Grid

## Applies To

- `/admin/contacts`
- `/admin/quotes`
- `/admin/orders`
- `/admin/reviews`
- `/admin/events`
- `/admin/menu-items`

## URL Query Contract

Admin list pages accept these common query parameters where applicable:

| Param | Meaning | Example |
|-------|---------|---------|
| `search` | Free-text search | `?search=mayberry` |
| `status` | Domain status filter | `?status=closed` |
| `sort` | Sort column key | `?sort=name` |
| `direction` | Sort direction | `?direction=asc` |
| `page` | 1-based page number | `?page=2` |

Rules:

- Unknown sort keys fall back to the list default.
- Unknown directions fall back to `desc` unless the page default differs.
- `page` below 1 falls back to `1`.
- Changing `search`, `status`, `sort`, or `direction` resets `page` to `1`.
- Pagination links preserve all active search, status, sort, and direction values.

## Grid Behavior Contract

Each grid must provide:

- A header row with visible labels.
- Sortable headers for supported columns.
- A clear current sort indicator.
- A row count that communicates current page count and total matching records.
- A dedicated actions column.
- A responsive small-screen layout that keeps primary fields and actions visible.

## Contacts Minimum Columns

- Customer
- Email
- Phone
- Source
- Status
- Created or updated date
- Actions

## Quotes Minimum Columns

- Customer
- Event type
- Event date
- Guests
- Status
- Actions

## Orders Minimum Columns

- Order identifier
- Customer
- Fulfillment
- Payment or delivery status
- Total
- Actions

## Reviews Minimum Columns

- Reviewer
- Rating
- Occasion
- Status
- Submitted date
- Actions

## Events Minimum Columns

- Event title
- Event date
- Location
- State
- Actions

## Menu Items Minimum Columns

- Item
- Price
- Size
- Lead time
- Visibility
- Featured state
- Actions

## Confirmation Contract

Any destructive action must open an in-app confirmation dialog with:

- Record name or identifier.
- Plain-language consequence.
- Cancel action.
- Confirm action.
- Disabled/loading state while saving.

Browser-native alert, confirm, and prompt dialogs are not allowed.
