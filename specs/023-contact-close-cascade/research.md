# Research: Contact Close → Cascade Close Related Quotes

## Existing linkage and precedent

- `quotes.contact_id` already foreign-keys quotes to contacts. A contact's quotes are fetched in `ContactService.getContactDetail` via `from("quotes").eq("contact_id", contactId)`.
- The **reverse** cascade already exists: `quoteService.updateQuoteStatus` sets the contact to `booked`/`closed` and writes an `interactions` row when a quote moves to those statuses. This feature is the symmetric **forward** direction.
- The only write path for contact status is `ContactService.updateContactStatus`, called solely from `PATCH /api/admin/contacts/[id]/status`. The only UI that triggers it is `ContactStatusSelect`, rendered once on the contact detail page. → Single integration point for both service and UI.

## Decision: atomicity via a Postgres function

**Question**: FR-003 requires closing the contact and all its open quotes (plus audit rows) as all-or-nothing. How?

**Options considered**:
1. Sequential Supabase client writes (mirror `updateQuoteStatus`). Simple and matches existing style, but not atomic — a mid-sequence failure leaves a partial state (e.g., quotes closed, contact still open).
2. Single Postgres function (`close_contact_cascade`) invoked via `supabase.rpc`, running in one transaction.

**Decision**: Option 2. A multi-row, multi-table cascade with an all-or-nothing requirement is exactly what a DB transaction is for. It also encapsulates the cascade once (DRY) instead of scattering ordered writes in TypeScript. The function uses `security invoker` so existing RLS tenant policies still apply, plus an explicit `tenant_id` filter for defense in depth.

**Trade-off**: Introduces the first `rpc`/plpgsql usage in the codebase, deviating from the sequential precedent. Accepted because correctness (FR-003) outweighs uniformity here, and the deviation is isolated to one well-named function.

## Decision: cascade is server-authoritative; UI only warns

The confirmation prompt is a UX guard, not the trigger. `updateContactStatus` cascades whenever the target status is `closed`, regardless of how it was called. This keeps the invariant in one place and means a stale open-quote count in the UI cannot produce an inconsistent result.

## Decision: open vs terminal quote statuses

Non-terminal (closed by cascade): `new`, `in_progress`, `booked`. Terminal (left untouched): `closed`, `lost`. Matches the row-state mapping established in feature 020.

## Decision: no auto-reopen

Reopening a contact (closed → contacted/new/booked) does not reopen quotes. Confirmed with owner: closing means cutting ties; reversal is manual per quote. No reverse trigger is added.

## Open items for /clarify (non-blocking)

- Whether to also write a single summary interaction on the contact (in addition to per-quote rows). Current design: one row per closed quote + one row for the contact status change, consistent with existing interaction logging.
- Whether a future iteration should reconcile both cascade directions into a shared module. Out of scope here.
