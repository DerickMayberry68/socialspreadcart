# Feature Specification: Customer Quote Confirmation + Order-Created Notification

**Feature Branch**: `022-confirmation-and-order-notifications`
**Created**: 2026-06-08
**Status**: Draft
**Input**: "Send the customer a confirmation that their quote was received (Shayley will contact them), and notify the owner when an order is created."

## User Scenarios & Testing

### User Story 1 - Customer gets a quote confirmation (Priority: P1)
When a customer submits the quote form, they receive a friendly auto-reply confirming the request was received and that Shayley will follow up.

**Acceptance**: Given a valid quote with a customer email, when submitted, then a confirmation email is sent to the customer's address; replies route to the owner mailbox. The customer submission still succeeds even if the confirmation fails to send.

### User Story 2 - Owner is notified of new orders (Priority: P1)
When a guest order is created (pickup → payment_pending, or delivery → delivery_requested), the owner receives a notification with order details.

**Acceptance**: Given an order is created via checkout, when the order + items are persisted, then a notification is sent to the owner address with guest details, items, total, fulfillment type, and status. Order creation still succeeds even if the notification fails.

### Edge Cases
- No customer email on the quote/order: confirmation/owner-notification recipient resolution skips cleanly (never guesses).
- Email provider failure: never blocks the quote submission or order creation; outcome is logged.

## Requirements
- **FR-001**: On a valid quote submission, send a confirmation email to the customer's submitted address.
- **FR-002**: On order creation (pickup or delivery), send an owner notification to `QUOTE_NOTIFICATION_EMAIL`.
- **FR-003**: Both sends are best-effort — failures never break the customer-facing flow; each outcome (sent/skipped/failed) is logged.
- **FR-004**: Customer confirmation sets Reply-To to the owner mailbox; owner notifications set Reply-To to the customer so replies reach the right party.

## Assumptions
- Reuses the Resend-backed `sendMail` primitive and the existing `QUOTE_NOTIFICATION_EMAIL` / `RESEND_*` config from feature 021.
- Owner order notification fires at **order creation** (`OrderService.createCheckout`). If unpaid/abandoned pickup orders prove noisy, the pickup-path notification can move to the paid webhook (`applyHostedCheckoutEvent`); delivery requests must notify at creation since the owner acts before payment.
- Customer order confirmation (separate from the quote confirmation) is out of scope for this iteration.
