# Feature Specification: Reliable Quote Request Owner Notification

**Feature Branch**: `021-quote-notification-fix`  
**Created**: 2026-06-07  
**Status**: Draft  
**Input**: User description: "When someone asks for a quote on the site we need to notify the tenant owner with an email. We thought this was happening but it isn't reliably finished."

> **Implementation note (2026-06-07):** The Microsoft 365 Graph app-only approach was abandoned because Shayley's M365 is GoDaddy-managed (federated tenant blocks Entra app registration / admin consent). Final implementation sends via **Resend** through a provider-neutral mailer primitive; the service-layer hardening (owner-only recipient, never-throws, logged outcomes) is unchanged. See `src/lib/email/mailer.ts`.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner is notified of a new quote request (Priority: P1)

A prospective customer fills out the quote request form on the public site and submits it. The tenant owner receives an email notification containing the request details so they can follow up promptly.

**Why this priority**: This is the core value of the feature. Today the notification can silently fail to send, or be sent to the wrong recipient, which means the owner misses leads. Without this, the rest is irrelevant.

**Independent Test**: Submit a valid quote request with notification configuration present and confirm an email is delivered to the configured owner address with the request details.

**Acceptance Scenarios**:

1. **Given** notification delivery is configured and an owner notification address is set, **When** a customer submits a valid quote request, **Then** the quote is saved and a notification email is delivered to the owner address (never to the customer's own address by default).
2. **Given** a quote request is submitted, **When** the notification email is composed, **Then** it contains the requester's name, email, phone, event date, event type, guest count, requested services, and message.

---

### User Story 2 - A failed notification never breaks the customer's submission (Priority: P1)

A customer submits a valid quote request, but the email delivery provider is unreachable or misconfigured. The customer still receives a success confirmation because their request was saved, and the delivery failure is recorded for the operator to diagnose.

**Why this priority**: Currently a notification send error throws after the quote is already saved, causing the customer to see an error on an otherwise successful submission. Lead capture must never depend on email delivery succeeding.

**Independent Test**: Force a delivery failure (e.g., invalid provider credentials) and confirm the customer still gets a success response, the quote is persisted, and an error is logged.

**Acceptance Scenarios**:

1. **Given** the quote is successfully saved, **When** the notification send fails for any reason, **Then** the customer still receives a success response and the failure is logged with enough detail to diagnose.
2. **Given** notification delivery is not configured at all, **When** a customer submits a quote, **Then** the submission succeeds, no email is attempted, and the skipped notification is observable in logs.

---

### User Story 3 - Operator can diagnose whether notifications are working (Priority: P2)

An operator (Derick) needs to confirm whether notifications are actually being sent, skipped, or failing, without guessing, so configuration problems are visible.

**Why this priority**: The current silent no-op is the reason the feature "looked done but wasn't." Observability turns an invisible gap into a diagnosable one.

**Independent Test**: Trigger each path (sent, skipped-due-to-no-config, failed) and confirm each produces a distinct, identifiable log entry.

**Acceptance Scenarios**:

1. **Given** any quote submission, **When** the notification step runs, **Then** exactly one outcome (sent, skipped, or failed) is logged.

---

### Edge Cases

- Notification delivery configured but no explicit owner recipient set: the system MUST NOT fall back to emailing the requester; it MUST treat this as "skipped/misconfigured" and log it.
- Email provider returns an error or times out: the customer submission still succeeds; the error is logged, not surfaced to the customer.
- Required configuration entirely absent (e.g., demo mode): submission succeeds and notification is cleanly skipped.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST send an owner notification email when a valid quote request is submitted and notification delivery is configured.
- **FR-002**: The notification recipient MUST be an owner/operator address. The system MUST NOT silently fall back to sending the notification to the requesting customer's email address.
- **FR-003**: If the owner recipient address is not configured, the system MUST skip sending (rather than emailing the customer) and record that the notification was skipped.
- **FR-004**: A failure or exception during notification sending MUST NOT cause the customer-facing submission to fail; the customer MUST still receive a success response when the quote was saved.
- **FR-005**: The system MUST log a distinct, identifiable outcome for each submission's notification step: sent, skipped (not configured), or failed (with error detail).
- **FR-006**: The notification email MUST include the requester's name, email, phone, event date, event type, guest count, requested services, and message.

### Key Entities *(include if feature involves data)*

- **Quote Request**: The submitted lead — requester contact details and event details. Already persisted; no schema change.
- **Notification Configuration**: Operator-provided settings that determine whether and to whom notifications are sent (delivery credentials, sender identity, owner recipient address).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid quote submissions, when notifications are configured with an owner recipient, result in a notification delivered to the owner address (and 0% delivered to the requester by default).
- **SC-002**: 100% of valid quote submissions return a success response to the customer even when notification delivery fails.
- **SC-003**: Every submission produces exactly one notification-outcome log entry, so an operator can determine the state of notifications by inspecting logs.

## Assumptions

- The existing quote persistence flow (`submitQuote`) is correct and unchanged; this feature only concerns the notification step and its reliability.
- Full per-tenant configuration of the notification recipient is out of scope for this iteration (explicitly deferred by the operator). A single owner recipient is configured via environment. Multi-tenant-correct recipient sourcing is noted as future work.
- Email delivery moves from the previous provider (Resend) to Microsoft 365 via the Microsoft Graph API using app-only (client-credentials) authentication. The Resend dependency and code path are removed.
- Delivery requires an Entra ID (Azure AD) app registration with the `Mail.Send` application permission and admin consent, a client secret, and a licensed sender mailbox. Creating and configuring these credentials in the hosting environment is the operator's responsibility and is verified separately from this code change.
- No new npm dependency is required; the Graph token request and `sendMail` call are made with the built-in `fetch`.
