# Tasks: Delivery Approval Before Payment

**Input**: Design documents from `/specs/018-delivery-approval/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: Included because the feature specification and plan require focused service, API, and component validation.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase because it touches different files or has no dependency on incomplete work.
- **[Story]**: User story label from `spec.md`.
- Each task includes exact file paths.

---

## Phase 1: Setup

**Purpose**: Confirm current checkout/order implementation and add shared schema support for delivery approval.

- [ ] T001 Review current checkout, admin orders, order, payment, and webhook paths in `src/app/api/checkout/route.ts`, `src/app/api/admin/orders/route.ts`, `src/services/order-service.ts`, `src/services/payment-service.ts`, `src/components/order/checkout-form.tsx`, and `src/components/admin/order-manager.tsx`
- [ ] T002 Add delivery approval database migration in `supabase/migrations/20260515_delivery_approval_orders.sql`
- [ ] T003 [P] Extend shared order types with delivery statuses, delivery address, decision metadata, and status history shapes in `src/lib/types/order.ts`
- [ ] T004 [P] Extend order validation schemas for delivery fulfillment and admin delivery decisions in `src/lib/validation/order.ts`

---

## Phase 2: Foundational

**Purpose**: Core service and persistence behavior that blocks all user stories.

- [ ] T005 Update order row mapping and totals handling for delivery approval fields in `src/services/order-service.ts`
- [ ] T006 Add order status history helpers in `src/services/order-service.ts`
- [ ] T007 Add payment eligibility checks that block unapproved, declined, withdrawn, expired, or already-paid delivery requests in `src/services/payment-service.ts`
- [ ] T008 Update Stripe webhook reconciliation to preserve delivery approval rules in `src/app/api/webhooks/stripe/route.ts` and `src/services/payment-service.ts`
- [ ] T009 [P] Add focused order-service tests for delivery approval persistence and status history in `tests/services/order-service.test.ts`
- [ ] T010 [P] Add focused payment-service tests for delivery payment eligibility in `tests/services/payment-service.test.ts`

**Checkpoint**: Database shape, shared types, validation, service mapping, history, and payment guards are ready.

---

## Phase 3: User Story 1 - Customer Requests Delivery Without Paying First (Priority: P1) MVP

**Goal**: Customers can choose delivery, enter required delivery details, submit a delivery request, and avoid payment collection until approval.

**Independent Test**: Add an item to the Order Tray, choose delivery, submit required delivery details, and confirm the response records a delivery request without a payment session.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add checkout API test for delivery request mode and no checkout URL in `tests/api/checkout-delivery-request.test.ts`
- [ ] T012 [P] [US1] Add checkout form component test for delivery-required fields and approval copy in `tests/components/checkout-form.test.tsx`

### Implementation for User Story 1

- [ ] T013 [US1] Update checkout form fulfillment UI and submission payload for pickup versus delivery in `src/components/order/checkout-form.tsx`
- [ ] T014 [US1] Update checkout API to branch delivery requests away from payment session creation in `src/app/api/checkout/route.ts`
- [ ] T015 [US1] Update order submission service behavior for delivery request creation in `src/services/order-service.ts`
- [ ] T016 [US1] Update confirmation API and UI messaging for delivery-request status in `src/app/api/checkout/confirm/route.ts` and `src/components/order/order-confirmation.tsx`

**Checkpoint**: User Story 1 works independently; delivery requests submit without payment.

---

## Phase 4: User Story 2 - Admin Approves Or Declines Delivery Requests (Priority: P2)

**Goal**: Tenant admins can review delivery requests and approve, decline, offer pickup, or withdraw approval.

**Independent Test**: Submit a delivery request, sign in as a tenant admin, and verify the admin can see and decide the request without exposing it to another tenant.

### Tests for User Story 2

- [ ] T017 [P] [US2] Add admin delivery decision API tests in `tests/api/admin-delivery-decision.test.ts`
- [ ] T018 [P] [US2] Add admin order manager component tests for delivery decision controls in `tests/components/order-manager.test.tsx`

### Implementation for User Story 2

- [ ] T019 [US2] Add admin delivery decision route guarded by `requireTenantAdmin()` in `src/app/api/admin/orders/[id]/delivery-decision/route.ts`
- [ ] T020 [US2] Add delivery decision service methods for approve, decline, offer pickup, and withdraw approval in `src/services/order-service.ts`
- [ ] T021 [US2] Update admin orders API filtering and response mapping for delivery statuses in `src/app/api/admin/orders/route.ts`
- [ ] T022 [US2] Update admin order manager to show delivery request details, status labels, and decision actions in `src/components/admin/order-manager.tsx`

**Checkpoint**: User Story 2 works independently; admins can decide delivery requests with tenant scoping.

---

## Phase 5: User Story 3 - Customer Pays Only After Approval (Priority: P3)

**Goal**: Approved delivery requests can create a payment session, show approved details and totals, and become paid only after provider confirmation.

**Independent Test**: Approve a delivery request, open the payment path, verify approved details/totals, complete payment, and confirm admin shows paid delivery details.

### Tests for User Story 3

- [ ] T023 [P] [US3] Add delivery payment API tests for approved, expired, withdrawn, declined, and paid states in `tests/api/checkout-delivery-payment.test.ts`
- [ ] T024 [P] [US3] Add confirmation component test for approved delivery payment action and invalid states in `tests/components/order-confirmation.test.tsx`

### Implementation for User Story 3

- [ ] T025 [US3] Add approved delivery payment route in `src/app/api/checkout/delivery-payment/route.ts`
- [ ] T026 [US3] Add approved delivery payment creation method in `src/services/payment-service.ts`
- [ ] T027 [US3] Update customer confirmation UI to show approved delivery details, expiration, final totals, and payment action in `src/components/order/order-confirmation.tsx`
- [ ] T028 [US3] Update checkout confirmation page to preserve delivery request status and approved payment path in `src/app/(site)/checkout/confirmation/page.tsx`

**Checkpoint**: User Story 3 works independently; approved delivery orders can be paid and invalid delivery orders cannot.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, documentation, and cleanup across all stories.

- [ ] T029 [P] Update delivery approval quickstart with any final implementation decisions in `specs/018-delivery-approval/quickstart.md`
- [ ] T030 [P] Update environment or setup documentation if payment-link behavior adds new configuration in `.env.example` or `README.md`
- [ ] T031 Run `npm test` and fix regressions
- [ ] T032 Run `npx tsc --noEmit` and fix type errors
- [ ] T033 Review `git diff` for unrelated changes and ensure only delivery approval work plus the existing verification tag commit history are included

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies.
- **Phase 2**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP delivery request behavior.
- **Phase 4 (US2)**: Depends on Phase 2 and benefits from US1-created delivery requests.
- **Phase 5 (US3)**: Depends on US2 approval behavior.
- **Phase 6**: Depends on implemented user stories.

### User Story Dependencies

- **US1 (P1)**: Required first because it creates delivery requests.
- **US2 (P2)**: Requires delivery requests to review and decide.
- **US3 (P3)**: Requires approved delivery requests before payment can be created.

### Parallel Opportunities

- T003 and T004 can run in parallel after T001.
- T009 and T010 can run in parallel after foundational service contracts are understood.
- T011 and T012 can run in parallel for US1.
- T017 and T018 can run in parallel for US2.
- T023 and T024 can run in parallel for US3.
- T029 and T030 can run in parallel during polish.

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 so delivery requests submit without payment.
3. Validate US1 independently before expanding admin and payment behavior.

### Incremental Delivery

1. Add delivery request submission and confirmation.
2. Add admin decision workflow.
3. Add approved-delivery payment path.
4. Run automated tests and quickstart manual acceptance paths.
