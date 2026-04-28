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
- `tax_cents`: tax amount when configured
- `fee_cents`: service or processing fee when configured
- `total_cents`: final amount presented for payment
- `currency`: payment currency, default `usd`
- `status`: draft, payment_pending, paid, payment_failed, cancelled, preparing, fulfilled
- `payment_status`: not_started, pending, paid, failed, cancelled, refunded
- `created_at`, `updated_at`

**Validation Rules**:
- `tenant_id` is required and must match the active tenant.
- At least one guest contact method is required.
- Total must equal subtotal plus tax/fees.
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
- `created_at`, `updated_at`

**Validation Rules**:
- Amount and currency must match the guest order total.
- Provider references must be unique when present.
- Payment status updates must be idempotent.
- No card numbers, CVV values, or sensitive credentials are stored.

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
