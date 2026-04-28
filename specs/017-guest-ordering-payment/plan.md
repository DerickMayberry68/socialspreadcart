# Implementation Plan: Guest Ordering Payment

**Branch**: `017-guest-ordering-payment` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/017-guest-ordering-payment/spec.md`

## Summary

Create a tenant-scoped guest ordering and online payment flow for Shayley's public site. Guests select active menu items into an **Order Tray**, review and submit contact/fulfillment details, pay online, and receive confirmation. Shayley admins can view paid orders for fulfillment. Implementation will add order storage, order/payment services, public checkout routes, a payment confirmation flow, payment webhook handling, and an admin orders view while preserving tenant isolation.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router  
**Primary Dependencies**: Next.js Server Components/Server Actions, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK to be added for payment sessions and webhook verification  
**Storage**: Supabase Postgres tables for guest orders, order items, and payment records; existing `menu_items` table remains the source for orderable items  
**Testing**: Vitest, Testing Library, `npm test`, `npx tsc --noEmit`  
**Target Platform**: Public Next.js web app deployed for tenant-hosted customer ordering and protected admin fulfillment  
**Project Type**: Web application with server-rendered public pages, API routes, services layer, and Supabase persistence  
**Performance Goals**: Order Tray interactions feel immediate; checkout submission returns the next action in under 3 seconds during normal operation; admin order list loads recent paid orders in under 2 seconds  
**Constraints**: Guest flow must not require authentication; all order data must be tenant-scoped; no direct Supabase/payment SDK usage from pages or components; no sensitive payment credentials stored; no `window.alert`, `window.confirm`, or `window.prompt`  
**Scale/Scope**: Version 1 supports Shayley tenant guest orders for active menu items, online card payment, confirmation, and admin fulfillment visibility; delivery logistics, coupons, subscriptions, refunds, taxes beyond configured order totals, and inventory depletion are outside v1 unless already captured in menu data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Responsibility**: PASS. Order UI, order services, payment services, validation schemas, and admin views will be split by responsibility.
- **Open/Closed**: PASS. Existing menu service remains the source for menu items; order-specific behavior is added via new services and routes rather than rewriting current menu/admin features.
- **Liskov Substitution**: PASS. Services will expose typed contracts with Zod validation and stable return shapes.
- **Interface Segregation**: PASS. Separate `OrderService`, `PaymentService`, validation schemas, and UI components keep interfaces narrow.
- **Dependency Inversion**: PASS. Supabase and Stripe access stay behind services/API routes. Components and pages do not instantiate SDK clients.
- **UX & Brand Standards**: PASS. Public flow uses existing brand tokens, typography, Radix dialogs where needed, and `sonner` for non-blocking feedback.
- **Testing/Verification**: PASS. Plan includes service, route, and component coverage plus `npm test` and `npx tsc --noEmit`.

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
    |-- components/order/
    |-- services/
    `-- api/

supabase/
`-- migrations/
    `-- 20260428_guest_ordering_payment.sql
```

**Structure Decision**: Use the existing single Next.js application structure. Public pages and components own rendering only; all data access and payment orchestration flows through `src/services/`. Admin order access follows the existing tenant-admin guard pattern used by admin API routes.

## Complexity Tracking

No constitution violations or unusual complexity are required.
