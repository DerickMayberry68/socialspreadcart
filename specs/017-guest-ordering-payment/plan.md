# Implementation Plan: Guest Ordering Payment

**Branch**: `fix/admin-event-schema-cache` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-guest-ordering-payment/spec.md`

## Summary

Extend the guest ordering payment flow so final checkout totals include Stripe-configured tax and a customer-visible non-taxable processing fee. The customer-paid processing fee uses an exact 2.6% gross-up target, while Shayley absorbs any actual processor cost above that target. Tax and fee totals must be shown before payment, persisted separately on the order, reconciled from the payment provider after payment confirmation, and displayed consistently in confirmation and admin views.

The technical approach is to keep the existing tenant-scoped Order Tray, order service, payment service, Stripe Checkout, and webhook reconciliation flow, then add a server-side quote/finalization step that calculates tax before Checkout, computes the non-taxable fee, creates Stripe Checkout with matching taxable menu item line items plus a non-taxable fee line item, and updates persisted order totals from Stripe confirmation data.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router  
**Primary Dependencies**: Next.js Server Components/Server Actions, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK 22.1.0, Stripe Checkout, Stripe Tax Calculation
**Storage**: Supabase Postgres tables for guest orders, order items, and payment records; existing `menu_items` table remains the source for orderable items; guest orders must persist `subtotal_cents`, `tax_cents`, `fee_cents`, and `total_cents` as separate values
**Testing**: Vitest, Testing Library, `npm test`, `npx tsc --noEmit`; focused service tests for tax/fee math and webhook reconciliation
**Target Platform**: Public Next.js web app deployed for tenant-hosted customer ordering and protected admin fulfillment  
**Project Type**: Web application with server-rendered public pages, API routes, services layer, and Supabase persistence  
**Performance Goals**: Order Tray interactions feel immediate; checkout total calculation and payment session creation return in under 3 seconds during normal operation; admin order list loads recent paid orders in under 2 seconds
**Constraints**: Guest flow must not require authentication; all order data must be tenant-scoped; pages/components must not instantiate Supabase or Stripe clients; no sensitive payment credentials stored; no `window.alert`, `window.confirm`, or `window.prompt`; tax/fee totals shown before payment must match final paid totals
**Scale/Scope**: Version 1 supports Shayley tenant guest orders for active menu items, online card payment, Stripe-configured tax, a non-taxable 2.6% gross-up processing fee, confirmation, and admin fulfillment visibility; coupons, subscriptions, refunds, inventory depletion, and multi-provider tax logic are outside this change

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Responsibility**: PASS. Tax/fee calculation belongs in order/payment services; UI components render totals and status only.
- **Open/Closed**: PASS. Existing checkout flow is extended through narrow service helpers and route contracts instead of moving SDK logic into components.
- **Liskov Substitution**: PASS. Service return shapes remain typed and validation-backed; totals are explicit fields rather than implicit string parsing.
- **Interface Segregation**: PASS. Order total quoting, payment session creation, and webhook reconciliation remain separate responsibilities.
- **Dependency Inversion**: PASS. Supabase and Stripe access remain behind `src/services/`; pages/components depend on API/service contracts.
- **UX & Brand Standards**: PASS. Customer-facing totals are clear, uncluttered, and use existing brand components; no browser alert/confirm/prompt patterns.
- **Testing/Verification**: PASS. Plan includes service, route, component, and manual Stripe webhook validation.

## Project Structure

### Documentation (this feature)

```text
specs/017-guest-ordering-payment/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api-contracts.md
|   `-- order-flow.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (site)/
|   |   |-- menu/page.tsx
|   |   |-- order-tray/page.tsx
|   |   `-- checkout/
|   |       |-- page.tsx
|   |       `-- confirmation/page.tsx
|   |-- api/
|   |   |-- checkout/route.ts
|   |   |-- checkout/confirm/route.ts
|   |   |-- webhooks/stripe/route.ts
|   |   `-- admin/orders/route.ts
|   `-- admin/(shell)/
|       `-- orders/page.tsx
|-- components/
|   |-- order/
|   |   |-- add-to-order-button.tsx
|   |   |-- order-tray-panel.tsx
|   |   |-- checkout-form.tsx
|   |   `-- order-confirmation.tsx
|   `-- admin/
|       `-- order-manager.tsx
|-- services/
|   |-- order-service.ts
|   `-- payment-service.ts
|-- lib/
|   |-- validation/order.ts
|   `-- types/order.ts
`-- tests/
    |-- api/
    |-- components/order/
    |-- components/admin/
    `-- services/

supabase/
`-- migrations/
    `-- 20260428_guest_ordering_payment.sql
```

**Structure Decision**: Use the existing single Next.js application structure. Public pages and components own rendering only; order totals, tax calculation, fee math, Supabase persistence, Stripe Checkout, and webhook reconciliation flow through `src/services/` and API routes.

## Complexity Tracking

No constitution violations or unusual complexity are required.

## Phase 0 Research

Research is documented in [research.md](./research.md). Key decisions:

- Use Stripe Tax Calculation before Checkout to calculate tax from the business tax configuration and the order's fulfillment/location details.
- Compute a non-taxable processing fee with an exact 2.6% gross-up after tax is known.
- Create Stripe Checkout with menu item line items marked taxable and a separate processing fee line item marked non-taxable.
- Persist pre-payment totals and reconcile final paid totals from Stripe webhook session data.

## Phase 1 Design

Design artifacts updated:

- [data-model.md](./data-model.md): adds tax calculation references, processing-fee fields, and persisted final total rules.
- [contracts/api-contracts.md](./contracts/api-contracts.md): updates checkout and confirmation payloads to include subtotal, tax, fee, and total breakdowns.
- [contracts/order-flow.md](./contracts/order-flow.md): updates the flow to calculate tax and fee before Checkout and reconcile totals after webhook confirmation.
- [quickstart.md](./quickstart.md): adds validation steps for Stripe tax, non-taxable fee, webhook reconciliation, and admin display.

## Post-Design Constitution Check

- **Single Responsibility**: PASS. The design keeps calculation/reconciliation in services and display in components.
- **Open/Closed**: PASS. Existing order/payment services are extended with focused helpers.
- **Liskov Substitution**: PASS. Service contracts explicitly include total breakdowns and payment status.
- **Interface Segregation**: PASS. Quote, checkout, webhook, and admin contracts stay narrow.
- **Dependency Inversion**: PASS. Stripe/Supabase SDK usage remains service-backed.
- **UX & Brand Standards**: PASS. Customer sees a clear total breakdown before authorizing payment.
- **Testing/Verification**: PASS. Automated and manual Stripe validation paths are documented.
