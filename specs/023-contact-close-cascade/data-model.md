# Data Model: Contact Close → Cascade Close Related Quotes

No table or column changes. One new Postgres function and a clarified status contract.

## Affected tables (existing)

### contacts
| Field | Notes |
|-------|-------|
| `status` | `new` \| `contacted` \| `booked` \| `closed`. Cascade triggers only on transition into `closed`. |
| `updated_at` | Set to `now()` when status changes. |

### quotes
| Field | Notes |
|-------|-------|
| `contact_id` | FK to `contacts.id`. The cascade's selector. |
| `status` | `new` \| `in_progress` \| `booked` \| `closed` \| `lost`. Non-terminal = `new`/`in_progress`/`booked`; terminal = `closed`/`lost`. |
| `updated_at` | Set to `now()` for each quote the cascade closes. |

### interactions
| Field | Notes |
|-------|-------|
| `contact_id`, `tenant_id` | Scope. |
| `type` | `status_change` for both per-quote cascade rows and the contact closure row. |
| `body` | Human-readable reason (quote closed via contact closure; contact status change). |

## New function: `close_contact_cascade`

```text
close_contact_cascade(p_tenant_id uuid, p_contact_id uuid, p_previous_status text default null) returns integer
```

Runs in a single transaction (`security invoker`, `search_path = public`):

1. Update `quotes` → `closed` where `tenant_id = p_tenant_id AND contact_id = p_contact_id AND status IN ('new','in_progress','booked')`; capture affected ids.
2. Insert one `interactions` (`status_change`) row per closed quote, attributing the closure to the contact being closed.
3. Update the `contacts` row → `closed`, `updated_at = now()`.
4. Insert one `interactions` (`status_change`) row for the contact closure (using `p_previous_status` when supplied).
5. Return the number of quotes closed.

If any step errors, the whole transaction rolls back (FR-003).

## Status transition rules

| Contact transition | Quote effect |
|--------------------|--------------|
| → `closed` | All non-terminal quotes for the contact → `closed`; terminal quotes unchanged. |
| → `new` / `contacted` / `booked` | No quote change (FR-007). |
| `closed` → any (reopen) | No quote change; quotes are not reopened. |

## Validation rules

- Inputs validated by `updateContactStatusSchema` (tenant uuid, contact uuid, status enum) before the RPC is called.
- Tenant scoping enforced both by the explicit `tenant_id` filter inside the function and by existing RLS (`security invoker`).
- Terminal quotes are excluded by the `status IN (...)` predicate.
