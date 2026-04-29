# Research: Guest Ordering Payment

## Decision: Use "Order Tray" as the selected-items surface

**Rationale**: The customer-facing language avoids "cart", which can be confused with the food/beverage cart service and the SocialSpreadCart product name. "Order Tray" still communicates that the guest is collecting items before checkout.

**Alternatives considered**:
- Cart: rejected because the user explicitly flagged naming confusion.
- Basket: acceptable in retail contexts but less aligned with catering/food presentation.
- Order Bag: less premium and less suitable for Shayley's brand.

## Decision: Use Stripe-hosted payment checkout for v1

**Rationale**: Hosted checkout keeps sensitive payment entry outside the app, reduces PCI scope, supports common card payment expectations, and still lets the app reconcile orders through payment references and webhooks.

**Alternatives considered**:
- Embedded card fields: rejected for v1 because it increases UI and compliance complexity.
- Manual invoice/payment links: rejected because the feature requires guests to order and pay through the site flow.
- Cash/offline payment: rejected for v1 because the spec requires online payment.

## Decision: Create an order before payment, mark paid only after confirmation

**Rationale**: The app needs a stable order reference before redirecting to payment, but must not treat an order as paid until payment is confirmed. This supports abandoned checkout, retry, webhook reconciliation, and duplicate-submission protection.

**Alternatives considered**:
- Create orders only after payment: rejected because payment provider callbacks need a durable local order reference.
- Mark paid on checkout submission: rejected because declined/cancelled payment would create false paid orders.

## Decision: Store immutable order item snapshots

**Rationale**: Menu items may change after an order is placed. Fulfillment and reconciliation require the item name, price, quantity, and notes/options exactly as the guest reviewed them before payment.

**Alternatives considered**:
- Reference only live menu items: rejected because later menu edits could alter historical orders.
- Store free-form item text only: rejected because it weakens validation and tenant isolation.

## Decision: Tenant scope every order, item, and payment record

**Rationale**: SocialSpreadCart is a shared multi-tenant platform. Shayley's guest orders must be isolated from all other tenants in both public and admin workflows.

**Alternatives considered**:
- Global order table without tenant_id: rejected because it violates tenant isolation requirements.
- Separate database per client: rejected because the project uses shared tenant-scoped records.

## Decision: Public checkout uses service-layer validation and route contracts

**Rationale**: The constitution requires pages/components to avoid direct data access and SDK usage. Routes and services can validate inputs, re-check menu availability, calculate final totals, create orders, create payment sessions, and reconcile webhook events.

**Alternatives considered**:
- Client-only checkout state sent directly to payment provider: rejected because prices and availability must be verified server-side.
- Page-level Supabase/payment calls: rejected by the services-layer mandate.
