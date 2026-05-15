# Implementation Plan: Delivery Approval Before Payment

**Branch**: `018-delivery-approval` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/018-delivery-approval/spec.md`

## Summary

Extend the existing Order Tray checkout so pickup can continue to proceed directly to payment, while delivery-selected orders become approval-required requests before any payment is collected. Shayley reviews delivery requests in admin, then approves, declines, withdraws, or offers pickup instead. Only approved delivery requests can create a customer payment path, and that payment path must preserve the approved fulfillment details, totals, status history, tenant scoping, and payment safeguards.

The technical approach is to build on the existing tenant-scoped `guest_orders`, `guest_order_items`, `payment_records`, `OrderService`, `PaymentService`, checkout API, admin orders API, admin orders page, and order components. Add explicit delivery request statuses, persisted delivery address/approval metadata, order status history, admin decision endpoints, and customer payment entry for approved delivery requests. Keep Supabase and Stripe access behind services.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router  
**Primary Dependencies**: Next.js Server Components/API routes, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK 22.1.0  
**Storage**: Supabase Postgres tables for `guest_orders`, `guest_order_items`, `payment_records`; new delivery approval metadata and status history stored in tenant-scoped tables/columns  
**Testing**: Vitest, Testing Library, `npm test`, `npx tsc --noEmit`; focused service, API route, and component tests for delivery request branching and admin decisions  
**Target Platform**: Public Next.js web app for guest checkout plus protected tenant admin order management  
**Project Type**: Web application with server-rendered public pages, client form interactions, API routes, services layer, and Supabase persistence  
**Performance Goals**: Customer delivery request submission completes in under 3 seconds during normal operation; admin order list opens pending delivery requests in under 2 seconds; approval creates a payment-ready state in under 3 seconds  
**Constraints**: Guest delivery flow must not require authentication; all order data must remain tenant-scoped; no payment collection before delivery approval; no page/component may call Supabase or Stripe directly; no `window.alert`, `window.confirm`, or `window.prompt`; approved payment links must become invalid after expiration or material change  
**Scale/Scope**: Version 1 supports manual delivery approval for Shayley's tenant, pickup direct payment, delivery request submission, admin approve/decline/pickup-offer/withdraw actions, approved delivery payment, status history, and order visibility. Automated routing, capacity calendars, mileage pricing, event conflict automation, refunds, and SMS automation are out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Responsibility**: PASS. Checkout components render fulfillment choices; `OrderService` handles order/request state; `PaymentService` handles payment session creation and webhook reconciliation.
- **Open/Closed**: PASS. Existing checkout/payment flow is extended by adding a delivery-request branch and admin decision actions rather than replacing pickup payment behavior.
- **Liskov Substitution**: PASS. Order/payment return shapes remain explicit and typed; new statuses are represented in shared order types and validation schemas.
- **Interface Segregation**: PASS. Submission, admin decision, approved payment, and fulfillment update contracts remain separate.
- **Dependency Inversion**: PASS. Supabase and Stripe access remain behind `src/services/`; API routes and components depend on service abstractions.
- **UX & Brand Standards**: PASS. Customer language is clear, calm, and operational: "Delivery Requested", "Delivery Approved - Payment Needed", "Delivery Declined", and "Paid".
- **Testing/Verification**: PASS. Plan includes service, API, component, and manual acceptance coverage for the approval-before-payment rule.

## Project Structure

### Documentation (this feature)

```text
specs/018-delivery-approval/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api-contracts.md
|   `-- order-flow.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (site)/
|   |   |-- checkout/
|   |   |   |-- page.tsx
|   |   |   `-- confirmation/page.tsx
|   |   `-- order-tray/page.tsx
|   |-- api/
|   |   |-- checkout/route.ts
|   |   |-- checkout/confirm/route.ts
|   |   |-- checkout/delivery-payment/route.ts
|   |   |-- admin/orders/route.ts
|   |   |-- admin/orders/[id]/delivery-decision/route.ts
|   |   `-- webhooks/stripe/route.ts
|   `-- admin/(shell)/
|       `-- orders/page.tsx
|-- components/
|   |-- order/
|   |   |-- checkout-form.tsx
|   |   |-- order-confirmation.tsx
|   |   `-- order-tray-panel.tsx
|   `-- admin/
|       `-- order-manager.tsx
|-- services/
|   |-- order-service.ts
|   `-- payment-service.ts
|-- lib/
|   |-- types/order.ts
|   `-- validation/order.ts
`-- tests/
    |-- api/
    |-- components/
    `-- services/

supabase/
`-- migrations/
    `-- [timestamp]_delivery_approval_orders.sql
```

**Structure Decision**: Use the existing single Next.js application and services-layer architecture. The feature extends current checkout, admin orders, order types, validation schemas, and database migrations. It does not introduce a separate quote subsystem for delivery, because these are menu-item orders with approval-gated fulfillment, not custom quotes.

## Complexity Tracking

No constitution violations or unusual complexity are required.

## Phase 0 Research

Research is documented in [research.md](./research.md). Key decisions:

- Use "approve first, charge second" for delivery rather than payment authorization/capture.
- Keep delivery requests in the order domain, not the quote domain.
- Add explicit order/request statuses instead of overloading `payment_pending`.
- Persist status history for admin decisions and auditability.
- Use manual admin delivery decisions in v1; automated event/capacity conflict checks are deferred.

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md): delivery request fields, approval metadata, status history, payment eligibility, and state transitions.
- [contracts/api-contracts.md](./contracts/api-contracts.md): checkout branching, admin delivery decision, approved delivery payment, confirmation, and admin list contracts.
- [contracts/order-flow.md](./contracts/order-flow.md): customer and admin state flow from Order Tray through approval, payment, fulfillment, decline, withdrawal, and expiration.
- [quickstart.md](./quickstart.md): review checklist for client approval plus implementation validation commands and manual acceptance paths.

## Post-Design Constitution Check

- **Single Responsibility**: PASS. Delivery approval state lives in order services and persistence; UI components do not own business rules.
- **Open/Closed**: PASS. Pickup checkout remains intact while delivery adds a separate branch and decision actions.
- **Liskov Substitution**: PASS. Existing paid order behavior is preserved; new states are explicit and typed.
- **Interface Segregation**: PASS. API contracts separate checkout submission, delivery decisions, payment creation, and fulfillment updates.
- **Dependency Inversion**: PASS. Direct database/payment SDK access remains isolated to services.
- **UX & Brand Standards**: PASS. The design avoids quote terminology for menu-item delivery requests and keeps customer/admin labels clear.
- **Testing/Verification**: PASS. Automated and manual checks cover tenant isolation, no-payment-before-approval, status transitions, and payment invalidation.
