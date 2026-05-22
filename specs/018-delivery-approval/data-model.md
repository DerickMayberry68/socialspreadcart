# Data Model: Delivery Approval Before Payment

## Existing Entities Extended

### Guest Order

Represents a submitted customer order for a tenant.

Existing fields remain relevant:

- `id`
- `tenant_id`
- `guest_name`
- `guest_email`
- `guest_phone`
- `fulfillment_type`
- `fulfillment_requested_at`
- `fulfillment_notes`
- `subtotal_cents`
- `tax_cents`
- `fee_cents`
- `total_cents`
- `currency`
- `status`
- `payment_status`
- `created_at`
- `updated_at`

New or expanded fields:

- `fulfillment_address`: structured delivery address persisted for delivery requests and tax/payment review.
- `delivery_status`: delivery workflow state when `fulfillment_type = delivery`.
- `delivery_fee_cents`: optional approved delivery fee, stored separately from item subtotal, tax, and processing fee.
- `approved_total_cents`: final payable total at approval time.
- `delivery_decision_note`: current customer-visible decision note or next step.
- `delivery_approved_at`: timestamp when delivery became payment-ready.
- `delivery_approval_expires_at`: timestamp after which the customer can no longer pay without reapproval.
- `delivery_decided_by`: tenant admin user id for the latest approval, decline, pickup offer, or withdrawal.

Validation rules:

- Delivery orders must have a usable address, requested date/time, and contact method.
- Delivery orders cannot be paid unless delivery status is approved, not expired, and not withdrawn.
- Pickup orders do not require delivery approval metadata.
- Tenant id must match across order, order items, payment records, and status history.

### Guest Order Item

Represents a menu item captured on an order.

No new conceptual fields are required for v1, but item rows must remain immutable enough that the customer pays for the item names, prices, quantities, and notes that were approved.

### Payment Record

Represents the payment provider reconciliation record.

Rules:

- Delivery requests do not create a payment record until approval creates a payment-ready path.
- Payment records may only be created for delivery orders that are approved and unexpired.
- Webhook reconciliation must not mark declined, withdrawn, expired, or unapproved delivery requests as paid.

## New Entity: Order Status History

Represents structured changes to order, delivery, and payment state.

Fields:

- `id`
- `tenant_id`
- `order_id`
- `event_type`: `submitted`, `delivery_requested`, `delivery_approved`, `delivery_declined`, `pickup_offered`, `approval_withdrawn`, `approval_expired`, `payment_started`, `payment_paid`, `payment_failed`, `fulfillment_updated`
- `from_status`
- `to_status`
- `note`
- `customer_visible`
- `created_by`
- `created_at`

Validation rules:

- Every history row must belong to the same tenant as the order.
- Admin decision events require an authenticated tenant admin.
- Customer-submitted events may omit `created_by`.

## Delivery Status Values

- `not_required`: pickup or non-delivery orders.
- `requested`: customer submitted delivery request; no payment allowed.
- `approved_payment_needed`: Shayley approved delivery; customer may pay until expiration.
- `declined`: Shayley declined delivery; no payment allowed.
- `pickup_offered`: Shayley offered pickup instead; customer must accept before payment.
- `approval_withdrawn`: Shayley withdrew a previous approval; no payment allowed.
- `expired`: approval window expired before payment; no payment allowed.
- `paid`: approved delivery order has been paid.

## State Transitions

```text
pickup checkout -> payment_pending -> paid -> preparing -> fulfilled

delivery checkout -> requested
requested -> approved_payment_needed
requested -> declined
requested -> pickup_offered

approved_payment_needed -> paid
approved_payment_needed -> approval_withdrawn
approved_payment_needed -> expired

pickup_offered -> payment_pending when customer accepts pickup
pickup_offered -> cancelled when customer declines or abandons

declined -> cancelled
approval_withdrawn -> cancelled or requested if resubmitted
expired -> requested if resubmitted
```

## Payment Eligibility

An order is eligible for payment when:

- It belongs to the current tenant.
- It has at least one item.
- It has a valid customer contact method.
- For pickup: status is `payment_pending` and payment status is `not_started` or `pending`.
- For delivery: delivery status is `approved_payment_needed`, approval has not expired, approval has not been withdrawn, final totals are present, and payment status is `not_started` or `pending`.

An order is not eligible for payment when:

- Delivery status is `requested`, `declined`, `pickup_offered`, `approval_withdrawn`, `expired`, or `paid`.
- Payment status is `paid`, `failed`, `cancelled`, or `refunded` unless a later approved retry flow explicitly allows it.
- Any approved item, delivery fee, tax, processing fee, or total has materially changed without reapproval.
