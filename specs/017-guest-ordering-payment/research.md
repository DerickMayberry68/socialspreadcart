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

## Decision: Calculate tax before Checkout with Stripe Tax Calculation

**Rationale**: The customer must see the final payable total before authorizing payment, and the 2.6% gross-up processing fee depends on the tax amount. Stripe Checkout automatic tax can calculate tax during the hosted payment session, but that is too late for an exact pre-payment fee calculation. A server-side tax calculation step lets the app use Shayley's Stripe tax configuration before creating the Checkout session, then create Stripe Checkout with equivalent line items for payment and reconciliation.

**Alternatives considered**:
- Hardcoded Arkansas/local tax percentage: rejected because the spec requires using the business's configured tax rules and because taxability can vary by location and item treatment.
- Stripe Checkout automatic tax only: rejected for this change because the processing fee must be known and displayed before payment.
- Manual tax entry in environment variables: rejected because it would drift from Stripe tax settings and increase operational risk.

## Decision: Use a non-taxable processing-fee line item with exact 2.6% gross-up

**Rationale**: Shayley's existing business policy charges guests 2.6% toward card processing while she absorbs any remaining processor cost. The fee must be visible and non-taxable. An exact gross-up prevents under-collecting the stated 2.6% because the processor percentage applies to the final charged amount, not only the pre-fee subtotal.

**Formula**:

```text
taxable_total = subtotal_cents + tax_cents
fee_cents = ceil((taxable_total / (1 - 0.026)) - taxable_total)
total_cents = taxable_total + fee_cents
```

**Alternatives considered**:
- Simple `subtotal * 2.6%`: rejected because it does not cover the fee's contribution to the final charge and ignores tax.
- Passing through Stripe's actual fee: rejected because actual fee can depend on card mix, fixed per-transaction fees, international cards, and account pricing; the business policy is a customer-paid 2.6%, not a full variable pass-through.
- Taxing the fee: rejected by product decision; processing fee is explicitly non-taxable.

## Decision: Reconcile final totals from Stripe webhook data

**Rationale**: The local order should store pre-payment totals before redirect, but final paid order views must match the payment provider's confirmed amount. Webhook handling is the authoritative point for marking an order paid and should also update payment amount and any final tax/fee/total fields available from the Checkout Session.

**Alternatives considered**:
- Trust only pre-payment local totals forever: rejected because provider-confirmed totals are the source of truth for payment reconciliation.
- Mark paid from the browser redirect: rejected because redirects are not payment proof and can race ahead of webhooks.
