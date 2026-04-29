# Data Model: Guest Ordering Payment

## GuestOrder

Represents a guest-submitted order for one tenant.

**Fields**:
- `id`: stable order identifier
- `tenant_id`: owning tenant
- `guest_name`: required customer name
- `guest_email`: optional when phone is provided; required for email confirmation if selected
- `guest_phone`: optional when email is provided; required for phone-based follow-up if selected
- `fulfillment_type`: pickup, delivery, event, or other configured handoff type
- `fulfillment_requested_at`: requested date/time when applicable
- `fulfillment_notes`: optional guest instructions
- `subtotal_cents`: sum of item line totals before fees/taxes
- `tax_cents`: tax amount calculated from configured tax rules before payment and reconciled after payment
- `fee_cents`: non-taxable 2.6% gross-up processing fee
- `total_cents`: final amount presented for payment
- `currency`: payment currency, default `usd`
- `status`: draft, payment_pending, paid, payment_failed, cancelled, preparing, fulfilled
- `payment_status`: not_started, pending, paid, failed, cancelled, refunded
- `created_at`, `updated_at`

**Validation Rules**:
- `tenant_id` is required and must match the active tenant.
- At least one guest contact method is required.
- Total must equal subtotal plus tax/fees.
- Processing fee must be non-negative and non-taxable.
- Processing fee must use the 2.6% gross-up formula against subtotal plus tax unless the business policy changes.
- Tax and total values shown to the customer before payment must match the payment session total within rounding rules.
- Paid orders must have at least one order item and a matching payment record.
- Admin order views must filter by `tenant_id`.

**State Transitions**:
- `draft` -> `payment_pending` when checkout details are accepted and a payment session is created.
- `payment_pending` -> `paid` when payment confirmation is received.
- `payment_pending` -> `payment_failed` when payment fails or is cancelled.
- `paid` -> `preparing` -> `fulfilled` as admin fulfillment progresses.
- `paid` -> `cancelled` only through an explicit admin/payment reconciliation flow.

## OrderItem

Represents one item snapshot within a guest order.

**Fields**:
- `id`: stable order item identifier
- `tenant_id`: owning tenant
- `order_id`: parent guest order
- `menu_item_id`: original menu item reference
- `name`: menu item name at order time
- `slug`: menu item slug at order time
- `unit_price_cents`: item price at order time
- `quantity`: requested quantity
- `line_total_cents`: unit price multiplied by quantity
- `notes`: optional guest item notes
- `options`: selected item options when available
- `created_at`

**Validation Rules**:
- Quantity must be a positive integer.
- Unit price and line total must be non-negative.
- The referenced menu item must belong to the same tenant and be active/orderable at checkout.
- Snapshot fields must not change when the live menu item changes later.

## PaymentRecord

Represents non-sensitive payment reconciliation details for one order.

**Fields**:
- `id`: stable payment record identifier
- `tenant_id`: owning tenant
- `order_id`: related guest order
- `provider`: payment provider name
- `provider_session_id`: checkout session reference
- `provider_payment_intent_id`: payment intent/reference when available
- `amount_cents`: payment amount
- `currency`: payment currency
- `status`: pending, paid, failed, cancelled, refunded
- `raw_event_id`: last processed provider event identifier for idempotency
- `tax_calculation_id`: provider tax calculation reference when available
- `amount_subtotal_cents`: provider-confirmed subtotal when available
- `amount_tax_cents`: provider-confirmed tax when available
- `amount_fee_cents`: provider-confirmed non-taxable processing fee when available
- `created_at`, `updated_at`

**Validation Rules**:
- Amount and currency must match the guest order total.
- Provider references must be unique when present.
- Payment status updates must be idempotent.
- No card numbers, CVV values, or sensitive credentials are stored.
- Provider-confirmed amount values should reconcile to the related guest order totals.

## OrderTotalQuote

Represents a server-calculated total breakdown before the guest is redirected to payment.

**Fields**:
- `tenant_id`: active tenant
- `items`: immutable order item snapshots used for calculation
- `subtotal_cents`: sum of order item line totals
- `tax_cents`: calculated applicable tax
- `fee_cents`: calculated non-taxable 2.6% gross-up processing fee
- `total_cents`: subtotal plus tax plus fee
- `currency`: payment currency, default `usd`
- `tax_calculation_id`: provider calculation reference when available
- `tax_location_source`: pickup/business location, delivery address, event address, or billing/contact details used for tax calculation
- `expires_at`: optional time after which the quote should be recalculated

**Validation Rules**:
- Quote must be generated server-side after revalidating item availability and prices.
- Quote must use the same item snapshots that are persisted to the order.
- Quote must be recalculated when quantity, item availability, fulfillment location, or price changes.
- Quote total must be the amount used to create the payment session.

## OrderTray

Represents temporary guest-selected items before checkout. This is client-visible state, not a paid order.

**Fields**:
- `tenant_id`: active tenant
- `items`: selected menu item ids, quantities, notes/options
- `last_updated_at`: used for session recovery or expiration

**Validation Rules**:
- Items must be revalidated against active tenant menu data before checkout submission.
- Empty Order Tray cannot proceed to checkout.
- Local/session state alone must never mark an order as paid.
