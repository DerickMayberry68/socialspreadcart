# Tasks: Stripe To Square Payment Conversion

**Input**: Design documents from `/specs/025-stripe-to-square/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Payment handling requires automated service and route coverage plus Square Sandbox acceptance before production activation.

**Organization**: Tasks are grouped by user story so pickup, approved delivery, admin reconciliation, and production activation can be validated as distinct outcomes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches separate files and does not depend on an incomplete task.
- **[Story]**: Maps to the prioritized user stories in `spec.md`.
- Every task includes an exact repository path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the supported Square dependency and configuration surface without enabling payments.

- [X] T001 Install exact dependency `square@44.2.0` and update `package.json` and `package-lock.json`
- [X] T002 [P] Add documented Square server-variable placeholders while keeping payments disabled by default in `.env.example`
- [X] T003 [P] Replace obsolete Chase discovery guidance with Square Sandbox/production configuration guidance in `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add provider-neutral persistence, types, and event idempotency required by every Square flow.

**CRITICAL**: No user-story payment work begins until this phase is complete.

- [X] T004 Create the Square reconciliation migration with `supabase migration new square_payment_reconciliation` and implement the `payment_records` extensions, indexes, `payment_webhook_events` table, RLS, and admin read policy in the generated `supabase/migrations/*_square_payment_reconciliation.sql`
- [X] T005 [P] Extend provider, checkout result, payment record, refund, and webhook event types in `src/lib/types/order.ts`
- [X] T006 [P] Add focused validation schemas for normalized provider events and Square configuration values in `src/lib/validation/order.ts`
- [X] T007 Implement provider-neutral event claiming, completion, failure, and lookup helpers in `src/services/order-service.ts`
- [X] T008 Update order/payment queries to support current active payment attempts and historical provider records in `src/services/order-service.ts`
- [X] T009 Add migration/type fixture support for new payment fields and webhook events in `tests/services/order-service.test.ts`

**Checkpoint**: The schema and service contracts can safely store Square references and deduplicate provider events.

---

## Phase 3: User Story 1 - Customer Pays For Pickup Through Square (Priority: P1) MVP

**Goal**: Create a Square-hosted pickup checkout with Square-owned tax/service-charge totals and reconcile successful or unsuccessful payment.

**Independent Test**: Submit a pickup order in Square Sandbox, verify item/tax/2.5% fee totals, complete payment, and confirm the website/admin order matches Square.

### Tests for User Story 1

- [X] T010 [P] [US1] Replace Stripe-only payment unit expectations with Square checkout creation, total normalization, configuration failure, and idempotency tests in `tests/services/payment-service.test.ts`
- [X] T011 [P] [US1] Add Square SDK adapter tests for order construction, automatic tax, delivery-service-charge exclusion, disabled tipping, buyer prepopulation, redirect URLs, and response normalization in `tests/services/square-payment-service.test.ts`
- [X] T012 [P] [US1] Update pickup order tests to assert the former 2.6% fee is not calculated and Square-returned totals are persisted in `tests/services/order-service.test.ts`
- [X] T013 [P] [US1] Add pickup checkout route tests for Square configuration, provider failure, and returned hosted URL/totals in `tests/api/checkout-route.test.ts`

### Implementation for User Story 1

- [X] T014 [US1] Implement lazy Square client/configuration creation, location validation, money normalization, and handled provider errors in `src/services/square-payment-service.ts`
- [X] T015 [US1] Implement Square full-order Payment Link creation with item snapshots, automatic taxes, configured service-charge verification, disabled tipping, idempotency key, buyer prepopulation, and returned order totals in `src/services/square-payment-service.ts`
- [X] T016 [US1] Refactor `PaymentService` into the provider-neutral checkout facade, enable `square`, disable new Stripe checkout when Square is active, and retain transition-only Stripe event support in `src/services/payment-service.ts`
- [X] T017 [US1] Remove Square orders from the former Stripe Tax and 2.6% gross-up path, then persist Square-returned totals and references before redirect in `src/services/order-service.ts`
- [X] T018 [US1] Map Square configuration and order-total validation failures to safe checkout API responses in `src/app/api/checkout/route.ts`
- [X] T019 [US1] Update checkout and confirmation copy only where it explicitly names the old fee/provider in `src/components/order/checkout-form.tsx` and `src/components/order/order-confirmation.tsx`

**Checkpoint**: Pickup checkout works end to end in mocked tests and is ready for Sandbox provider verification.

---

## Phase 4: User Story 2 - Customer Pays For Approved Delivery Through Square (Priority: P2)

**Goal**: Preserve delivery approval controls while creating and invalidating Square Payment Links.

**Independent Test**: Approve a delivery request with a fee, pay through Square Sandbox, and verify expired/withdrawn links cannot be paid.

### Tests for User Story 2

- [X] T020 [P] [US2] Add approved-delivery Square checkout tests covering fixed delivery service charge, Square totals, expiration, and repeated payment-start requests in `tests/services/order-service.test.ts`
- [X] T021 [P] [US2] Add Square Payment Link deletion tests for withdrawn, declined, expired, changed, and already-deleted delivery links in `tests/services/square-payment-service.test.ts`
- [X] T022 [P] [US2] Add approved-delivery payment route tests for valid, expired, withdrawn, declined, already-paid, and provider-unavailable states in `tests/api/checkout-delivery-payment.test.ts`
- [X] T023 [P] [US2] Add admin delivery-decision tests that verify active Square links are invalidated before non-payable state changes in `tests/api/admin-delivery-decision.test.ts`

### Implementation for User Story 2

- [X] T024 [US2] Add fixed non-taxable delivery service-charge construction and separate fee normalization in `src/services/square-payment-service.ts`
- [X] T025 [US2] Implement idempotent Square Payment Link retrieval/deletion in `src/services/square-payment-service.ts`
- [X] T026 [US2] Reuse valid active Square delivery links and safely supersede invalid attempts in `src/services/order-service.ts`
- [X] T027 [US2] Delete active Square links before delivery withdrawal, decline, expiration, or material reapproval changes in `src/services/order-service.ts`
- [X] T028 [US2] Return Square-hosted approved delivery checkout results and handled provider errors in `src/app/api/checkout/delivery-payment/route.ts`
- [X] T029 [US2] Preserve existing customer/admin delivery status language while showing Square-confirmed totals in `src/components/order/order-confirmation.tsx` and `src/components/admin/order-manager.tsx`

**Checkpoint**: Approved delivery payments work without weakening the approval or expiration rules.

---

## Phase 5: User Story 3 - Shayley Reconciles Square Orders In Admin (Priority: P3)

**Goal**: Verify Square events, update orders independently of browser return, handle refunds, and expose provider reconciliation details in admin.

**Independent Test**: Complete pickup and delivery payments without returning to the site, replay events, issue a Sandbox refund, and verify one accurate admin outcome per event.

### Tests for User Story 3

- [X] T030 [P] [US3] Add Square webhook signature, malformed payload, unsupported event, duplicate event, and retry response tests in `tests/api/square-webhook-route.test.ts`
- [X] T031 [P] [US3] Add payment status normalization and authoritative Square Order retrieval tests in `tests/services/square-payment-service.test.ts`
- [X] T032 [P] [US3] Add event-ledger idempotency, out-of-order event, no-browser-return, full refund, and delivery-state safeguard tests in `tests/services/order-service.test.ts`
- [X] T033 [P] [US3] Add provider-label and Square-reference rendering coverage in `tests/components/admin/order-manager.test.tsx`

### Implementation for User Story 3

- [X] T034 [US3] Implement raw-body Square signature verification and normalization for `payment.updated` and `refund.updated` in `src/services/square-payment-service.ts`
- [X] T035 [US3] Add `/api/webhooks/square` with signature enforcement, duplicate-safe success behavior, unsupported-event acknowledgement, and retryable failure responses in `src/app/api/webhooks/square/route.ts`
- [X] T036 [US3] Reconcile Square payment status and authoritative order totals through the event ledger in `src/services/order-service.ts`
- [X] T037 [US3] Reconcile completed full refunds while retaining partial-refund information without incorrectly changing paid orders in `src/services/order-service.ts`
- [X] T038 [US3] Keep Stripe webhook normalization operational for pre-cutover sessions while routing new Square events through the shared contract in `src/app/api/webhooks/stripe/route.ts` and `src/services/payment-service.ts`
- [X] T039 [US3] Show payment provider and non-sensitive provider references in the admin order detail surface in `src/components/admin/order-manager.tsx`

**Checkpoint**: Square, website, database, and admin records reconcile without depending on the customer redirect.

---

## Phase 6: User Story 4 - Business Activates Square Safely (Priority: P4)

**Goal**: Validate Sandbox behavior, audit Stripe transition state, and activate production with a controlled rollback.

**Independent Test**: Complete the documented Sandbox matrix, verify zero actionable Stripe sessions, then complete one low-value production payment with matching records.

### Tests for User Story 4

- [X] T040 [P] [US4] Add configuration-mode tests for disabled, Square Sandbox, Square production, missing location, missing webhook URL, and forbidden new Stripe checkout in `tests/services/payment-service.test.ts`
- [X] T041 [P] [US4] Add read-only configured Square location verification coverage in `tests/services/square-payment-service.test.ts`

### Implementation for User Story 4

- [X] T042 [US4] Add environment-aware Square configuration validation and fail-closed production activation behavior in `src/services/square-payment-service.ts`
- [X] T043 [US4] Add a read-only pending Stripe payment audit utility with no credential output in `scripts/audit-pending-stripe-payments.mjs`
- [X] T044 [US4] Update `.env.example` and `README.md` with exact Sandbox, webhook, production activation, zero-pending-Stripe, and rollback instructions
- [ ] T045 [US4] Update `specs/025-stripe-to-square/quickstart.md` with the final deployed preview URL, observed Square configuration behavior, and acceptance results

**Checkpoint**: The system is operationally ready for a controlled Square production cutover.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Validate security, schema, regression safety, and the complete customer-to-admin flow.

- [X] T046 [P] Run focused payment, checkout, delivery, webhook, confirmation, and admin tests with `npm test -- --run tests/services/payment-service.test.ts tests/services/square-payment-service.test.ts tests/services/order-service.test.ts tests/api/checkout-route.test.ts tests/api/checkout-delivery-payment.test.ts tests/api/square-webhook-route.test.ts tests/components/order/order-confirmation.test.tsx tests/components/admin/order-manager.test.tsx`
- [X] T047 [P] Run `npx tsc --noEmit`, `npm run build`, and `git diff --check`
- [X] T048 Apply the migration to the linked Supabase project and verify columns, indexes, RLS policies, and payment-event tenant isolation using remote SQL and Supabase advisors
- [ ] T049 Deploy a Vercel preview and configure the exact Square Sandbox webhook URL/signature key
- [ ] T050 Execute every Sandbox acceptance case in `specs/025-stripe-to-square/quickstart.md`, including three duplicate event deliveries and customer-no-return
- [X] T051 Verify there are zero actionable pending Stripe sessions before changing production provider configuration
- [ ] T052 Configure production Square credentials/webhook in Vercel, deploy with `PAYMENT_PROVIDER=square`, and complete the low-value production trial payment
- [ ] T053 Record production verification evidence and any deferred Stripe-removal cleanup in `specs/025-stripe-to-square/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks all payment stories.
- **US1 Pickup (Phase 3)**: Depends on Foundation; establishes core Square checkout.
- **US2 Delivery (Phase 4)**: Depends on US1 provider checkout and link lifecycle primitives.
- **US3 Reconciliation (Phase 5)**: Depends on Foundation and Square provider normalization; can overlap late US2 work after link identifiers are stable.
- **US4 Activation (Phase 6)**: Depends on US1-US3 behavior.
- **Polish (Phase 7)**: Depends on all implementation phases.

### User Story Dependencies

- **US1**: First independently deliverable Square MVP.
- **US2**: Reuses US1 checkout creation but remains independently testable through delivery approval.
- **US3**: Reuses provider references from US1/US2 and independently proves payment reconciliation.
- **US4**: Operationally validates and activates the completed stories.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T005 and T006 can run while T004 is being authored.
- US1 test tasks T010-T013 can run in parallel before implementation.
- US2 test tasks T020-T023 can run in parallel.
- US3 test tasks T030-T033 can run in parallel.
- T046 and T047 can run in parallel after implementation.

---

## Parallel Example: User Story 1

```text
Task T010: Payment facade and Square total tests
Task T011: Square SDK adapter request/response tests
Task T012: Order persistence tests
Task T013: Checkout route tests
```

## Parallel Example: User Story 3

```text
Task T030: Webhook route security and response tests
Task T031: Provider event normalization tests
Task T032: Event-ledger and order transition tests
Task T033: Admin provider display tests
```

---

## Implementation Strategy

### MVP First

1. Complete Setup and Foundation.
2. Implement US1 pickup checkout.
3. Validate Square Sandbox item, tax, 2.5% service charge, payment, and confirmation.
4. Do not enable production yet.

### Incremental Delivery

1. Pickup Square checkout.
2. Approved delivery link lifecycle.
3. Webhook/refund/admin reconciliation.
4. Sandbox acceptance and controlled production cutover.

### Safety Gates

- No production credentials before Sandbox acceptance.
- No `PAYMENT_PROVIDER=square` production switch before exact webhook configuration.
- No Square replacement link for an order with an actionable Stripe link.
- No general customer activation before the low-value production trial matches across all systems.
