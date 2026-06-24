# Data Model: Stripe To Square Payment Conversion

## Existing Entity: Guest Order

No new order table is required. Existing fields continue to own customer, fulfillment, approval, and final monetary state.

Relevant fields:

- `id`, `tenant_id`
- `fulfillment_type`, `fulfillment_address`, `fulfillment_requested_at`
- `delivery_status`, `delivery_fee_cents`, `delivery_approval_expires_at`
- `subtotal_cents`, `tax_cents`, `fee_cents`, `total_cents`, `currency`
- `status`, `payment_status`

### Monetary Rules

- Before Square checkout creation, menu subtotal and approved delivery fee come from application-owned order snapshots.
- After Square checkout creation, `subtotal_cents`, `tax_cents`, `fee_cents`, and `total_cents` are updated from the returned Square Order.
- `delivery_fee_cents` remains the approved business amount and must match the dedicated Square delivery service charge.
- The former 2.6% gross-up calculation is not used for Square orders.
- `total_cents = subtotal_cents + tax_cents + fee_cents + delivery_fee_cents`.

## Extended Entity: Payment Record

Existing `payment_records` remains provider-neutral.

### Existing Fields

- `id`, `tenant_id`, `order_id`
- `provider`
- `provider_session_id`
- `provider_payment_intent_id`
- `amount_subtotal_cents`, `amount_tax_cents`, `amount_fee_cents`, `amount_cents`
- `currency`, `status`, `raw_event_id`, `tax_calculation_id`
- `created_at`, `updated_at`

### New Fields

- `provider_order_id text null`
  - Square Order ID.
  - Unique with `provider` when populated.
- `provider_checkout_id text null`
  - Square Payment Link ID.
  - Retains explicit semantics while `provider_session_id` remains backward compatible.
- `provider_refund_id text null`
  - Most recent completed full-refund reference when applicable.
- `refunded_amount_cents integer not null default 0`
  - Provider-confirmed cumulative completed refund amount.
- `checkout_expires_at timestamptz null`
  - Internal payable window for approved delivery links.
- `superseded_at timestamptz null`
  - Marks a no-longer-payable provider attempt retained for audit.

### Validation And Index Rules

- Provider reference fields are unique per provider when non-null.
- Monetary values are non-negative.
- `refunded_amount_cents <= amount_cents`.
- The current active payment attempt for an order has `superseded_at is null`.
- Historical Stripe records remain unchanged unless an unpaid transition attempt is explicitly cancelled or superseded.

## New Entity: Payment Webhook Event

Tracks provider event idempotency and processing outcomes.

Fields:

- `id uuid`
- `provider text`
- `event_id text`
- `event_type text`
- `tenant_id uuid null`
- `order_id uuid null`
- `payment_record_id uuid null`
- `processing_status text`
  - `received`
  - `processed`
  - `ignored`
  - `failed`
- `error_message text null`
- `received_at timestamptz`
- `processed_at timestamptz null`

Constraints:

- Unique `(provider, event_id)`.
- Tenant/order/payment references use existing cascading relationships where appropriate.
- Raw card or sensitive payment data is never persisted.

## Provider Reference Mapping

| Application Field | Stripe Historical Meaning | Square Meaning |
|---|---|---|
| `provider` | `stripe` | `square` |
| `provider_session_id` | Checkout Session ID | Payment Link ID for backward-compatible display |
| `provider_checkout_id` | null | Payment Link ID |
| `provider_order_id` | null | Square Order ID |
| `provider_payment_intent_id` | Payment Intent ID | Square Payment ID |
| `tax_calculation_id` | Stripe Tax Calculation ID | null |
| `raw_event_id` | Latest Stripe event ID | Latest applied Square event ID |

## State Transitions

### Payment Attempt

```text
not_started
  -> pending (Square Payment Link created)
  -> paid (Square payment COMPLETED)
  -> failed (Square payment FAILED)
  -> cancelled (Square payment CANCELED or link deleted)
  -> refunded (completed refunds equal captured amount)
```

### Delivery Link

```text
approved_payment_needed
  -> pending link
  -> paid

approved_payment_needed
  -> approval_withdrawn / declined / expired / materially changed
  -> delete Square Payment Link
  -> cancelled payment attempt
```

### Webhook Event

```text
received -> processed
received -> ignored
received -> failed -> processed on retry
```

## Migration Behavior

1. Add Square reference/refund/lifecycle fields to `payment_records`.
2. Create partial unique indexes for non-null provider order and checkout IDs.
3. Create `payment_webhook_events` with RLS enabled.
4. Grant tenant admins read access only to events belonging to their tenant; service-role processing remains server-side.
5. Preserve all existing Stripe rows and constraints.
