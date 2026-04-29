# Tasks: Guest Ordering Payment

**Input**: Design documents from `specs/017-guest-ordering-payment/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because this feature handles payment state, tenant isolation, and persisted guest orders.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase because it touches different files and has no dependency on incomplete tasks.
- **[Story]**: User story label from `spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add payment dependency/configuration and create feature file locations.

- [X] T001 Add Stripe server SDK dependency to `package.json` and `package-lock.json`
- [X] T002 Add payment environment variable documentation for `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and checkout redirect URLs in `.env.example`
- [X] T003 [P] Create order type placeholder module in `src/lib/types/order.ts`
- [X] T004 [P] Create order validation placeholder module in `src/lib/validation/order.ts`
- [X] T005 [P] Create order service placeholder in `src/services/order-service.ts`
- [X] T006 [P] Create payment service placeholder in `src/services/payment-service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, shared types, validation, and service boundaries that all stories depend on.

**Critical**: No user story work should begin until this phase is complete.

- [X] T007 Create Supabase migration for `guest_orders`, `guest_order_items`, and `payment_records` in `supabase/migrations/20260428_guest_ordering_payment.sql`
- [X] T008 Add tenant-scoped RLS policies and indexes for guest orders, order items, and payment records in `supabase/migrations/20260428_guest_ordering_payment.sql`
- [X] T009 Define order status, payment status, order item, payment record, and order summary types in `src/lib/types/order.ts`
- [X] T010 Define Zod schemas for Order Tray item, checkout submission, payment confirmation, and admin fulfillment updates in `src/lib/validation/order.ts`
- [X] T011 Implement tenant-safe order total calculation and menu item revalidation helpers in `src/services/order-service.ts`
- [X] T012 Implement Stripe client creation, checkout session creation, and webhook signature verification helpers in `src/services/payment-service.ts`
- [X] T013 [P] Add service tests for total calculation, unavailable item handling, and tenant mismatch rejection in `tests/services/order-service.test.ts`
- [X] T014 [P] Add service tests for payment idempotency and webhook signature failure handling in `tests/services/payment-service.test.ts`

**Checkpoint**: Foundation ready. User story implementation can begin.

---

## Phase 3: User Story 1 - Guest Places And Pays For An Order (Priority: P1) MVP

**Goal**: Guest can add active menu items to the Order Tray, submit checkout details, pay online, and see confirmation.

**Independent Test**: Start as an unauthenticated visitor, add one active menu item, submit valid checkout details, complete test payment, and reach a paid confirmation with matching total.

### Tests for User Story 1

- [X] T015 [P] [US1] Add component tests for adding an item and displaying Order Tray totals in `tests/components/order/order-tray-panel.test.tsx`
- [X] T016 [P] [US1] Add API tests for `POST /api/checkout` validation and pending order creation in `tests/api/checkout-route.test.ts`
- [X] T017 [P] [US1] Add confirmation route tests for paid, pending, and missing orders in `tests/api/checkout-confirm-route.test.ts`

### Implementation for User Story 1

- [X] T018 [US1] Export or colocate order domain types with existing shared types in `src/lib/types.ts`
- [X] T019 [US1] Implement client-side Order Tray state management in `src/components/order/order-tray-panel.tsx`
- [X] T020 [US1] Implement add-to-order button behavior in `src/components/order/add-to-order-button.tsx`
- [X] T021 [US1] Replace menu "Add to Quote" ordering CTA with Order Tray behavior in `src/components/sections/menu-browser.tsx`
- [X] T022 [US1] Create public Order Tray page in `src/app/(site)/order-tray/page.tsx`
- [X] T023 [US1] Implement checkout form UI with field-level validation in `src/components/order/checkout-form.tsx`
- [X] T024 [US1] Create checkout page in `src/app/(site)/checkout/page.tsx`
- [X] T025 [US1] Implement order creation and checkout session route in `src/app/api/checkout/route.ts`
- [X] T026 [US1] Implement payment webhook route in `src/app/api/webhooks/stripe/route.ts`
- [X] T027 [US1] Implement checkout confirmation route in `src/app/api/checkout/confirm/route.ts`
- [X] T028 [US1] Implement confirmation UI in `src/components/order/order-confirmation.tsx`
- [X] T029 [US1] Create confirmation page in `src/app/(site)/checkout/confirmation/page.tsx`

**Checkpoint**: User Story 1 is complete when a guest can pay for one active item and see a paid confirmation.

---

## Phase 4: User Story 2 - Guest Adjusts Order Before Payment (Priority: P2)

**Goal**: Guest can update quantities, remove items, and preserve notes/options before checkout.

**Independent Test**: Add multiple items, update quantity, add an item note, remove an item, and verify the final checkout total and submitted order item snapshots match the reviewed Order Tray.

### Tests for User Story 2

- [X] T030 [P] [US2] Add component tests for quantity changes, item removal, and note preservation in `tests/components/order/order-tray-panel.test.tsx`
- [X] T031 [P] [US2] Add service tests for order item snapshots and changed-price conflict handling in `tests/services/order-service.test.ts`

### Implementation for User Story 2

- [X] T032 [US2] Add quantity stepper, remove action, and item notes fields to `src/components/order/order-tray-panel.tsx`
- [X] T033 [US2] Persist Order Tray state across navigation during the browsing session in `src/components/order/order-tray-panel.tsx`
- [X] T034 [US2] Include notes/options and snapshot fields during checkout submission in `src/components/order/checkout-form.tsx`
- [X] T035 [US2] Store immutable item snapshots and detect changed prices before payment in `src/services/order-service.ts`
- [X] T036 [US2] Return review-required conflicts from checkout route in `src/app/api/checkout/route.ts`

**Checkpoint**: User Story 2 is complete when edits made before payment are reflected in final order items and totals.

---

## Phase 5: User Story 3 - Shayley Receives Paid Order Details (Priority: P3)

**Goal**: Shayley admin can view paid guest orders with contact, items, totals, payment status, and fulfillment information.

**Independent Test**: Complete a paid guest order, sign in as Shayley's tenant admin, open admin orders, and confirm the order appears while another tenant cannot access it.

### Tests for User Story 3

- [X] T037 [P] [US3] Add API tests for tenant-admin order listing and cross-tenant rejection in `tests/api/admin-orders-route.test.ts`
- [X] T038 [P] [US3] Add component tests for admin order list rendering and empty state in `tests/components/admin/order-manager.test.tsx`

### Implementation for User Story 3

- [X] T039 [US3] Implement tenant-scoped admin order listing in `src/services/order-service.ts`
- [X] T040 [US3] Create admin orders API route using `requireTenantAdmin()` in `src/app/api/admin/orders/route.ts`
- [X] T041 [US3] Build admin order manager component in `src/components/admin/order-manager.tsx`
- [X] T042 [US3] Create admin orders page in `src/app/admin/(shell)/orders/page.tsx`
- [X] T043 [US3] Add admin navigation entry for orders in `src/app/admin/(shell)/layout.tsx`
- [X] T044 [US3] Add fulfillment status update support in `src/services/order-service.ts`
- [X] T045 [US3] Add fulfillment status route handling in `src/app/api/admin/orders/route.ts`

**Checkpoint**: User Story 3 is complete when paid Shayley orders are visible only to Shayley's authorized tenant admins.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, accessibility, documentation, and verification.

- [X] T046 [P] Add payment setup and webhook testing notes to `README.md`
- [X] T047 [P] Add customer-facing copy review for "Order Tray" labels in `src/components/order/order-tray-panel.tsx`
- [ ] T048 Run accessibility and responsive checks for `src/app/(site)/menu/page.tsx`, `src/app/(site)/order-tray/page.tsx`, `src/app/(site)/checkout/page.tsx`, `src/app/(site)/checkout/confirmation/page.tsx`, and `src/app/admin/(shell)/orders/page.tsx`
- [X] T049 Verify duplicate payment submissions do not create duplicate paid orders via `src/services/payment-service.ts`
- [ ] T050 Run quickstart validation from `specs/017-guest-ordering-payment/quickstart.md`
- [ ] T051 Run full automated verification from `package.json` with `npm test`
- [X] T052 Run TypeScript verification against `tsconfig.json` with `npx tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1.
- **Phase 3 US1**: Depends on Phase 2 and provides the MVP.
- **Phase 4 US2**: Depends on Phase 2; can start after foundation but integrates with US1 Order Tray files.
- **Phase 5 US3**: Depends on Phase 2 and needs at least one paid order path from US1 for full manual validation.
- **Phase 6 Polish**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3 after foundation.
- **US2 (P2)**: Can be developed after foundation, but edits the same Order Tray and checkout files as US1.
- **US3 (P3)**: Can start after foundation, but final validation depends on US1 payment confirmation.

### Parallel Opportunities

- T003-T006 can run in parallel after T001-T002.
- T013-T014 can run in parallel after validation/types exist.
- T015-T017 can run in parallel before US1 implementation.
- T030-T031 can run in parallel for US2.
- T037-T038 can run in parallel for US3.
- T046-T047 can run in parallel during polish.

## Parallel Example: User Story 1

```text
Task: "Add component tests for adding an item and displaying Order Tray totals in tests/components/order/order-tray-panel.test.tsx"
Task: "Add API tests for POST /api/checkout validation and pending order creation in tests/api/checkout-route.test.ts"
Task: "Add confirmation route tests for paid, pending, and missing orders in tests/api/checkout-confirm-route.test.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 User Story 1.
4. Validate a single-item paid order end to end.
5. Stop and demo before expanding adjustment and admin fulfillment workflows.

### Incremental Delivery

1. US1 delivers guest ordering and payment.
2. US2 improves pre-payment editing accuracy.
3. US3 gives Shayley operational order visibility.
4. Polish validates duplicate payment protection, responsive behavior, documentation, and automated checks.

## Notes

- Admin routes under `src/app/api/admin/orders/route.ts` must start with `requireTenantAdmin()` and short-circuit guard errors.
- Components and pages must not call Supabase or Stripe directly; use `src/services/order-service.ts` and `src/services/payment-service.ts`.
- Keep "Order Tray" as the visible customer-facing label unless the spec is amended.
- Do not store sensitive payment credentials or card details.
