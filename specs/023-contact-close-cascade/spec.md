# Feature Specification: Contact Close → Cascade Close Related Quotes

**Feature Branch**: `023-contact-close-cascade`
**Created**: 2026-06-08
**Status**: Draft
**Input**: "Closing a contact means cutting ties with that person. A contact can have many quotes over time. When an admin closes a contact, they should be warned with a confirmation prompt; on confirm, all of that contact's open quotes are closed too (closing a contact voids its future quotes). Closing a contact is for cutting ties, not for closing a single quote."

## Context

`quotes.contact_id` already links each quote to a contact, and the **reverse** direction already exists: `quoteService.updateQuoteStatus` sets the contact to `booked`/`closed` when a quote moves to those statuses. This feature adds the missing **forward** direction — closing a contact cascades to its open quotes — gated behind an explicit confirmation so an admin never voids quotes by accident.

The motivating problem: on the dashboard, the contact status pill and the quote source label sat next to each other and read as one value, leading an admin to close a contact when they meant to close a single quote. The label has been clarified separately; this feature makes the *behavior* of closing a contact deliberate and well-understood.

## User Scenarios & Testing

### User Story 1 - Admin closes a contact with open quotes (Priority: P1)

When an admin sets a contact's status to **Closed** and that contact has one or more quotes still open, the admin is shown a confirmation prompt stating how many open quotes will also be closed. On confirm, the contact and all its open quotes are closed together.

**Why this priority**: This is the core of the feature — preventing accidental quote closure while making intentional "cut ties" closure do the right thing in one action.

**Independent Test**: Create a contact with 2 open quotes; set the contact to Closed; verify the prompt names "2 open quotes"; confirm; verify the contact and both quotes are Closed.

**Acceptance Scenarios**:

1. **Given** a contact with status `contacted` and 2 quotes in status `new`/`in_progress`, **When** the admin sets the contact to `closed` and confirms, **Then** the contact becomes `closed` and both quotes become `closed`.
2. **Given** the same contact, **When** the admin sets the contact to `closed` but **cancels** the prompt, **Then** neither the contact nor any quote changes.

---

### User Story 2 - Admin closes a contact with no open quotes (Priority: P2)

When an admin closes a contact that has no open quotes (none, or all already `closed`/`lost`), the close applies directly with no cascade prompt.

**Why this priority**: Avoids a needless interruption when there is nothing to cascade.

**Independent Test**: Close a contact whose quotes are all `closed`/`lost` (or who has no quotes); verify it closes immediately with no prompt and no quote is altered.

**Acceptance Scenarios**:

1. **Given** a contact with zero quotes, **When** the admin sets it to `closed`, **Then** it closes with no prompt.
2. **Given** a contact whose only quote is already `lost`, **When** the admin sets it to `closed`, **Then** it closes with no prompt and the `lost` quote is unchanged.

---

### User Story 3 - Cascade is auditable (Priority: P3)

Each quote closed by the cascade records a status-change interaction noting it was closed because its contact was closed, so the trail explains why quotes moved without being touched individually.

**Why this priority**: Consistency with the existing interaction log; helpful for later "why did this close?" questions. Not required for the cascade to function.

**Independent Test**: Run a cascade over a contact with 1 open quote; verify an interaction row is written for that quote/contact describing the contact-close cascade.

**Acceptance Scenarios**:

1. **Given** a cascade closes 2 quotes, **When** it completes, **Then** an interaction is recorded attributing each closure to the contact being closed.

---

### Edge Cases

- **Reopening a contact does not reopen quotes.** Setting a closed contact back to `contacted`/`new`/`booked` leaves previously cascaded quotes `closed`. Closing is treated as "cut ties"; reversal is manual per quote. (Confirmed intended behavior.)
- **Partial failure.** If closing the contact or any quote in the cascade fails, the whole operation rolls back — no half-closed state where the contact is closed but some quotes remain open, or vice versa.
- **Only on transition into `closed`.** Setting a contact to `new`, `contacted`, or `booked` must never alter any quote.
- **Tenant isolation.** The cascade only ever touches quotes whose `contact_id` matches the contact and whose `tenant_id` matches the contact's tenant.
- **Concurrent quote created mid-close.** A quote created after the prompt's count is computed but before commit is out of scope for guaranteed inclusion; acceptable to leave it open (admin can re-close the contact).

## Requirements

### Functional Requirements

- **FR-001**: When an admin changes a contact's status to `closed` and that contact has at least one quote in a non-terminal status, the system MUST require an explicit confirmation before applying any change.
- **FR-002**: The confirmation MUST state how many open quotes will also be closed.
- **FR-003**: On confirm, the system MUST set the contact to `closed` and set every related non-terminal quote to `closed` as a single atomic operation (all succeed or none are applied).
- **FR-004**: On cancel, the system MUST make no change to the contact or any quote.
- **FR-005**: If the contact has no related non-terminal quotes, the system MUST close the contact directly without a cascade prompt.
- **FR-006**: Quotes already in a terminal status (`closed`, `lost`) MUST be left unchanged by the cascade.
- **FR-007**: The cascade MUST trigger only on a transition **into** `closed`; no other contact status change may affect quotes.
- **FR-008**: Each quote closed by the cascade MUST record a `status_change` interaction attributing the closure to the contact being closed.
- **FR-009**: All cascade reads and writes MUST be scoped to the contact's `tenant_id`; the cascade MUST NOT read or modify another tenant's records.
- **FR-010**: The existing reverse behavior (quote → contact status in `updateQuoteStatus`) MUST remain unchanged.

### Key Entities

- **Contact**: has `status` (`new` | `contacted` | `booked` | `closed`) and many Quotes via `quotes.contact_id`.
- **Quote**: has `status` (`new` | `in_progress` | `booked` | `closed` | `lost`) and `contact_id`. Non-terminal = `new` | `in_progress` | `booked`; terminal = `closed` | `lost`.
- **Interaction**: audit row (`type: "status_change"`) linked to a contact, used to record cascade closures.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Closing a contact with N open quotes results in exactly N quotes closed plus the contact closed, with zero partial states across the data set.
- **SC-002**: An admin can never move a contact to `closed` and have open quotes silently close without first seeing the count.
- **SC-003**: No contact status change other than into `closed` alters any quote (verified by regression test).
- **SC-004**: Reduce mis-closed-contact incidents (Shayley closing a contact when she meant a quote, or vice versa) to zero after rollout + training.

## Assumptions

- "Open" / non-terminal quote = status in `{new, in_progress, booked}`; terminal = `{closed, lost}`.
- Reuses the existing `quotes.contact_id` foreign key; no schema change is anticipated (to be confirmed in planning).
- Closing is intentionally one-directional: reopening a contact does not reopen quotes.
- The confirmation prompt follows the existing admin Radix Dialog / `sonner` patterns used elsewhere in the admin shell.
- The contact↔quote status sync continues to live in the services layer (`ContactService` / `quoteService`), consistent with current tenant-scoped service patterns.

## Out of Scope

- Customer-facing notification when quotes are voided by a contact close.
- Bulk-closing contacts from a list view (this spec covers closing a single contact).
- Auto-reopening quotes when a contact is reopened.
