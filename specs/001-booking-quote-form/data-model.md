# Data Model: Booking Quote Form

**Feature**: 001-booking-quote-form
**Date**: 2026-04-09

## Summary

No database schema migrations are required for this feature. The existing `quotes`,
`contacts`, and `interactions` tables are sufficient. Changes are confined to:
- Application-layer type refinement (event type becomes a constrained enum in Zod)
- A new TypeScript union type for event types
- Service extraction (no structural change to stored data)

---

## Entities

### Quote

Stored in the `quotes` table (existing). No column changes.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | PK | Auto-generated |
| contact_id | uuid | FK → contacts | Set on save; nullable until contact upsert |
| name | text | yes | Customer full name |
| email | text | yes | Lowercased on save |
| phone | text | yes | |
| event_date | date | yes | ISO date string; must be ≥ today + 2 days |
| event_type | text | yes | MUST be one of the defined EventType values |
| guests | text | yes | Free text / numeric string |
| services | text[] | yes | One or more of the defined ServiceOption values |
| message | text | no | Optional additional notes |
| status | text | yes | Default: `new` |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |

**Validation rules** (enforced by Zod schema in service layer):
- `event_date`: MUST be a valid date ≥ today + 48 hours
- `event_type`: MUST be one of `EventType` values (see TypeScript types below)
- `services`: MUST contain at least one item; each item MUST be a `ServiceOption`
- `name`: min 2 characters
- `email`: valid email format
- `phone`: min 7 characters
- `guests`: min 1 character

---

### Contact

Stored in the `contacts` table (existing). No column changes.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | PK | Auto-generated |
| name | text | yes | Updated on re-submission |
| email | text | yes | Unique; lowercased; conflict key for upsert |
| phone | text | no | Updated on re-submission |
| source | text | yes | Always `quote` for this feature |
| status | text | yes | Default: `new` |
| notes | text | no | |
| created_at | timestamptz | auto | |
| updated_at | timestamptz | auto | |

**Upsert behaviour**: When a quote is submitted, the system upserts a Contact by
`email`. If the contact already exists, `name` and `phone` are updated. `source`
and `status` are not overwritten on conflict.

---

### Interaction

Stored in the `interactions` table (existing). No column changes.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | PK | Auto-generated |
| contact_id | uuid | FK → contacts | Linked to the upserted contact |
| type | text | yes | Always `quote_submitted` for this feature |
| body | text | no | Human-readable summary of the quote |
| created_by | uuid | no | null for customer-submitted interactions |
| created_at | timestamptz | auto | |

---

## TypeScript Types

### New / Updated Types (in `src/types/`)

```typescript
// Event type enum — application-layer constraint
export const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Corporate Event",
  "Private Party",
  "Anniversary",
  "Baby/Bridal Shower",
  "Holiday Party",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// Service options (already in src/lib/site.ts as serviceOptions array)
// Promote to a const tuple for type safety
export const SERVICE_OPTIONS = [
  "Charcuterie Boxes",
  "Charcuterie Cups",
  "Dirty Soda 4-Pack",
  "Charcuterie Cart",
  "Dirty Soda Cart",
  "Mini Pancake Bar",
  "Bartending Service",
  "Ice Cream Toppings Bar",
  "Other",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

// QuoteRequest — replaces the existing QuoteRequest type in src/lib/types.ts
export type QuoteRequest = {
  name: string;
  email: string;
  phone: string;
  eventDate: string;        // ISO date string yyyy-MM-dd
  eventType: EventType;     // constrained (was free text)
  guests: string;
  services: ServiceOption[]; // constrained (was string[])
  message: string;
};
```

---

## State Transitions

### Quote Status

```
new → in_progress → booked
                 → closed
                 → lost
```

Customer-submitted quotes always enter as `new`. Admin transitions status
via the existing admin quote detail page. No changes to state machine for this
feature.

---

## No Migration Required

The schema is unchanged. The only data-layer change is the tightening of
application-level validation (Zod enum for `event_type`, constrained array for
`services`). Existing quote records with free-text event_type values are unaffected.
