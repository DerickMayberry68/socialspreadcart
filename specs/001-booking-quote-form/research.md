# Research: Booking Quote Form

**Feature**: 001-booking-quote-form
**Date**: 2026-04-09

## Decision Log

### D-001: Form Layout — Single Page vs. Multi-Step Wizard

**Decision**: Single-page form with logical visual grouping (date + event info first,
services second, contact details third).

**Rationale**: The form has a small number of fields (< 10 required). A wizard adds
navigation complexity and state-persistence concerns without meaningful UX gain for
this volume. Visual grouping achieves the "guided" feel specified without the overhead.
The existing form is already single-page; we preserve that interaction model.

**Alternatives considered**:
- Multi-step wizard (3 steps): Rejected — adds React state complexity, back/forward
  navigation, and risks losing data on refresh. Unjustified for < 10 fields.

---

### D-002: Date Picker Approach

**Decision**: Use the native HTML `<input type="date">` with `min` attribute set to
today + 48 hours, calculated at render time client-side.

**Rationale**: The project already uses `react-calendar` for the admin events calendar
but the public form only needs a simple date pick. The native date input is accessible,
mobile-friendly (triggers the OS date picker on mobile), and requires zero additional
dependencies. The `min` attribute enforces the 48-hour rule declaratively.

**Alternatives considered**:
- `react-calendar` on the public form: Rejected — adds bundle weight and custom styling
  overhead for a simple single-date selection.
- `date-fns` for validation only: Still used for calculating the min date string
  (`format(addDays(new Date(), 2), 'yyyy-MM-dd')`).

---

### D-003: Event Type — Dropdown vs. Segmented Control

**Decision**: `<select>` using the existing Radix `Select` component (already in
the project via `@radix-ui/react-select`), styled to match the brand.

**Rationale**: The project already imports `@radix-ui/react-select`. Using it ensures
consistent styling with the rest of the form's field components. The predefined event
type list (8 options + Other) fits cleanly in a dropdown.

**Options list** (from spec FR-003):
Wedding, Birthday, Corporate Event, Private Party, Anniversary, Baby/Bridal Shower,
Holiday Party, Other.

---

### D-004: Services Selection — Checkboxes vs. Card Grid

**Decision**: Card-style checkboxes (visual pill/card per service with a short
description line), using the existing `Checkbox` component from Radix UI.

**Rationale**: The current form already uses this pattern. Enhancing it with a one-line
description per service improves clarity without introducing new components.
Descriptions to add per service are derived from the site's existing menu/cart content.

---

### D-005: Constitution Compliance — API Route Refactor

**Decision**: Extract all Supabase and Resend logic from `src/app/api/quote/route.ts`
into dedicated services before or alongside the UI changes.

**Rationale**: The current route directly instantiates the Supabase service-role client
and calls Resend inline — a direct violation of Constitution Principle V (Dependency
Inversion) and Principle I (Single Responsibility). The plan MUST include a services
refactor as a prerequisite to any UI work.

**Services to create**:
- `src/services/quote-service.ts` — save quote, upsert contact, log interaction
- `src/services/email-service.ts` — send notification email via Resend

---

### D-006: Validation — Client vs. Server

**Decision**: Dual validation: client-side (React state + HTML5 constraints) for
immediate UX feedback; server-side Zod schema in the API route as the authoritative
gate. The event type field changes from `z.string().min(2)` to `z.enum([...])` using
the defined list.

**Rationale**: Client-side validation reduces round-trips for obvious errors (empty
fields, bad date). Server-side Zod is non-negotiable per Principle III (Liskov
Substitution — callers trust the service's type contract).

---

### D-007: No Database Schema Changes Required

**Decision**: The existing `quotes` table schema is sufficient. `event_type` is stored
as a `text` column — the enum constraint is enforced at the application layer (Zod),
not the database layer. No migration needed.

**Rationale**: Adding a Postgres enum or check constraint would require a migration and
would complicate future additions to the event type list. Application-layer validation
with Zod is the right boundary per Principle III.
