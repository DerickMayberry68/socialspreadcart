# Implementation Plan: Stripe To Square Payment Conversion

**Branch**: `025-stripe-to-square` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-stripe-to-square/spec.md`

## Summary

Replace new Stripe Checkout session creation and Stripe Tax calculation with Square-hosted Payment Links backed by Square Orders. Square will apply Shayley's catalog tax and calculate the explicitly configured 2.5% online service charge, and the application will persist the returned Square order breakdown before redirecting the customer. A Square webhook route will verify signatures and reconcile payment/refund events through the existing tenant-scoped order service. Historical Stripe records remain readable, and Stripe webhook support remains temporarily available only for a zero-pending-session transition window.

## Technical Context

**Language/Version**: TypeScript 5.6, React 19.2, Node.js 20+, Next.js 15.5 App Router  
**Primary Dependencies**: Next.js route handlers, Square Node SDK 44.2.0, existing Stripe SDK 22.1.0 for transition-only webhook compatibility, Supabase JS/SSR, Zod 4.3, Resend  
**Storage**: Existing Supabase Postgres `guest_orders`, `guest_order_items`, `payment_records`, and `order_status_history`; additive migration for Square order references and webhook-event idempotency  
**Testing**: Vitest, Testing Library, TypeScript validation, Next.js production build, Square Sandbox Payment Links and webhook delivery  
**Target Platform**: Public responsive website and protected tenant admin deployed to Vercel  
**Project Type**: Single Next.js web application with server-side service and route boundaries  
**Performance Goals**: Create a payable Square link and return the redirect response within 3 seconds under normal provider availability; reconcile a valid webhook within 2 seconds  
**Constraints**: No credentials in client code; no payment status from browser redirects; exact webhook URL required for signature validation; Square controls final tax and service-charge totals; delivery approval rules remain mandatory; no browser alert/confirm/prompt  
**Scale/Scope**: Shayley's tenant and Square seller account; pickup and approved delivery payments; existing low-volume local ordering workflow; multi-seller Square OAuth and admin-initiated refunds are out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Responsibility**: PASS. Square client/configuration, provider mapping, order persistence, and route handling remain separate responsibilities.
- **Open/Closed**: PASS. The provider-neutral order workflow is extended with a Square adapter and shared payment contract; UI checkout behavior remains stable.
- **Liskov Substitution**: PASS. Square returns the same checkout and hosted-event contracts currently consumed by `OrderService`.
- **Interface Segregation**: PASS. Checkout creation, payment-link deletion, webhook verification, event normalization, and order reconciliation use narrow functions.
- **Dependency Inversion**: PASS. Square and Stripe SDK usage remains in payment services; pages, components, and routes do not instantiate provider clients.
- **UX & Brand Standards**: PASS. Existing Order Tray, checkout, confirmation, error handling, and admin views are preserved.
- **Testing/Verification**: PASS. The plan includes unit, route, build, Sandbox, webhook replay, and low-value production verification.

## Project Structure

### Documentation (this feature)

```text
specs/025-stripe-to-square/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api-contracts.md
|   `-- payment-provider-contract.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   `-- api/
|       |-- checkout/
|       |   |-- route.ts
|       |   `-- delivery-payment/route.ts
|       `-- webhooks/
|           |-- square/route.ts
|           `-- stripe/route.ts
|-- services/
|   |-- order-service.ts
|   |-- payment-service.ts
|   `-- square-payment-service.ts
|-- lib/
|   |-- types/order.ts
|   `-- validation/order.ts
`-- components/
    |-- order/
    `-- admin/

supabase/
`-- migrations/
    `-- *_square_payment_reconciliation.sql

tests/
|-- api/
|   `-- square-webhook-route.test.ts
`-- services/
    |-- payment-service.test.ts
    |-- square-payment-service.test.ts
    `-- order-service.test.ts
```

**Structure Decision**: Extend the existing single Next.js application. Keep `PaymentService` as the provider-neutral facade, isolate Square SDK behavior in `square-payment-service.ts`, and preserve `OrderService` as the owner of tenant-scoped order/payment persistence and state transitions.

## Phase 0: Research Decisions

Research is captured in [research.md](./research.md). The primary decisions are:

1. Use Square Checkout `CreatePaymentLink` with a full Square Order rather than Quick Pay or embedded card fields.
2. Let Square auto-apply configured catalog taxes, include the configured processing percentage as a Square service charge, then persist the returned order totals.
3. Validate Square webhooks with the raw body, exact configured notification URL, signature key, and `x-square-hmacsha256-signature`.
4. Reconcile `payment.updated` and `refund.updated` events through a durable event-id ledger.
5. Delete Square Payment Links when an approved delivery payment becomes invalid before payment.
6. Require zero actionable pending Stripe sessions before general Square activation; keep historical Stripe records and transition webhook support without creating new Stripe sessions.

## Phase 1: Design

### Payment Creation

1. `OrderService` validates tenant items and fulfillment eligibility as it does today.
2. Pickup orders are initially persisted with menu subtotal and pending payment state; no former 2.6% fee is calculated.
3. `PaymentService` delegates new payment creation to Square when `PAYMENT_PROVIDER=square`.
4. Square checkout creation uses:
   - Ad-hoc menu line items with stable internal references.
   - A fixed, non-taxable delivery service charge when applicable.
   - Automatic Square tax application.
   - The environment-configured processing percentage as a non-taxable Square Order service charge.
   - Internal order ID as Square order reference.
   - Customer email/phone prepopulation and website redirect URLs.
   - Tipping disabled so Square cannot change the approved application total.
   - A deterministic idempotency key derived from the internal order and payment attempt.
5. The returned related Square Order is normalized into subtotal, tax, processing fee, delivery fee, total, currency, Square order ID, Payment Link ID, and checkout URL.
6. The application verifies expected tax/service-charge configuration and updates `guest_orders` plus `payment_records` before returning the checkout URL.

### Webhook Reconciliation

1. `/api/webhooks/square` reads the raw request body.
2. The route requires the Square signature header and verifies it with the exact configured notification URL.
3. Supported event types are normalized into the existing hosted payment event contract.
4. The event ledger claims the Square event ID before mutating order/payment state.
5. Payment events resolve the internal order from stored Square provider references, not from untrusted request metadata alone.
6. Square payment status maps to existing payment states:
   - `COMPLETED` -> `paid`
   - `FAILED` -> `failed`
   - `CANCELED` -> `cancelled`
   - `APPROVED` or `PENDING` -> `pending`
7. The Square Order is retrieved for authoritative item/tax/service-charge totals when processing a terminal payment state.
8. Completed refunds update the payment state to `refunded` only when the full captured amount has been refunded; partial refunds remain paid with recorded refund metadata for future enhancement.
9. Failed event processing is recorded for retry without marking the event successfully applied.

### Delivery Link Lifecycle

1. Approved delivery payment uses the same Square checkout creator with the persisted approved items, delivery fee, address, timing, and expiration.
2. Withdrawal, decline, expiration, or material change deletes the active Square Payment Link before the internal order becomes non-payable.
3. Repeated payment-start requests reuse the existing active Square link when still valid or replace it only after the prior link is deleted.

### Stripe Transition

1. `PAYMENT_PROVIDER=square` disables all new Stripe Checkout and Stripe Tax calls.
2. Historical Stripe payment rows remain unchanged and visible.
3. Before production cutover, admins verify no payable Stripe session remains pending. Any pending session is allowed to expire or is explicitly expired before Square is enabled for that order.
4. The Stripe webhook route and dependency remain during the limited transition window, then can be removed in a separate cleanup once pending Stripe sessions are zero.

### Configuration

Required server-only variables:

```text
PAYMENT_PROVIDER=square
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_ACCESS_TOKEN
SQUARE_LOCATION_ID
SQUARE_WEBHOOK_SIGNATURE_KEY
SQUARE_WEBHOOK_NOTIFICATION_URL
```

`SQUARE_APPLICATION_ID` remains documented for the Square application but is not required by server-side hosted checkout. Production activation fails closed when required production values are absent.

## Post-Design Constitution Check

- **Services-only SDK access**: PASS. Square code is isolated under `src/services/`.
- **Typed boundaries**: PASS. Provider responses normalize to explicit application contracts before reaching `OrderService`.
- **No UI business logic**: PASS. Existing components consume unchanged checkout/order result shapes.
- **Tenant isolation**: PASS. Internal tenant/order lookup remains authoritative; webhook provider references resolve to tenant-scoped rows.
- **Handled errors**: PASS. Configuration/provider failures use existing API error responses and inline/toast UI paths.
- **No unjustified complexity**: PASS. One provider adapter and one event ledger address the provider-specific and idempotency requirements without introducing a general plugin framework.

## Complexity Tracking

No constitution violations require justification.
