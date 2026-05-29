# Data Model: Admin List Grids

## AdminListQuery

Represents normalized list controls from the admin URL.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `search` | string | no | Trimmed free-text search. Empty string is treated as absent. |
| `status` | string | no | Domain-specific status filter. `"all"` is treated as absent. |
| `sort` | string | no | Domain-specific sortable column key. Invalid keys fall back to the page default. |
| `direction` | `"asc" \| "desc"` | yes | Invalid values fall back to the page default. |
| `page` | number | yes | 1-based page number, clamped to a valid positive integer. |
| `pageSize` | number | yes | Defaults to 25; may be clamped to allowed sizes. |

## PagedResult<T>

Common response shape for paged list services.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `records` | `T[]` | yes | Records for the current page only. |
| `total` | number | yes | Total matching records after search/filter, before pagination. |
| `page` | number | yes | Current valid page. |
| `pageSize` | number | yes | Number of requested records per page. |
| `pageCount` | number | yes | Total pages, minimum 1 for UI purposes. |

## AdminGridColumn

Describes a visible grid column.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `key` | string | yes | Stable column identifier. |
| `label` | string | yes | Header text shown to admins. |
| `sortable` | boolean | no | Whether the header can change sort state. |
| `align` | `"left" \| "right" \| "center"` | no | Defaults to left. |
| `priority` | `"primary" \| "secondary" \| "metadata"` | no | Used for responsive stacking. |

## AdminGridRow

Represents a rendered row independent of the domain record.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Record identifier. |
| `cells` | record | yes | Renderable values by column key. |
| `href` | string | no | Primary open/edit destination. |
| `state` | `"active" \| "muted" \| "warning"` | yes | Drives row emphasis. |
| `actions` | `GridRowAction[]` | yes | Explicit row actions. |

## GridRowAction

Represents an action available from a row.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `label` | string | yes | Visible or accessible label. |
| `kind` | `"open" \| "edit" \| "status" \| "delete" \| "archive" \| "custom"` | yes | Action category. |
| `requiresConfirmation` | boolean | yes | Required for destructive actions. |
| `disabled` | boolean | no | Prevents unsafe or unavailable action states. |

## Domain Record State Mapping

| Domain | Active States | Muted States | Risky Actions |
|--------|---------------|--------------|---------------|
| Contacts | `new`, `contacted`, `booked` | `closed` | delete/archive |
| Quotes | `new`, `in_progress`, `booked` | `closed`, `lost` | delete/close/lost |
| Orders | payment or delivery states needing action | `fulfilled`, `cancelled`, completed paid states when no action remains | cancel/delete |
| Reviews | `pending`, `approved` | `rejected`, `hidden` | hide/reject/delete |
| Events | future date | past date | delete |
| Menu Items | active/featured | inactive/hidden | delete |

## Validation Rules

- Sort keys must be allow-listed per domain.
- Page numbers below 1 resolve to page 1.
- Page sizes outside the allowed range resolve to the default.
- Muted rows must remain readable and actionable.
- Destructive actions require a confirmation flow.
