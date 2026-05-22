# Order Flow Contract: Delivery Approval Before Payment

## Pickup Flow

```text
Customer adds items to Order Tray
Customer chooses pickup
Customer enters contact and pickup timing
System validates items and totals
System creates order as payment_pending
System creates payment session
Customer pays
Webhook confirms payment
Order becomes paid
Admin fulfills order
```

Rules:

- Pickup remains the immediate payment path.
- Pickup does not require delivery approval fields.
- Pickup payment still requires valid contact details and item availability.

## Delivery Request Flow

```text
Customer adds items to Order Tray
Customer chooses delivery
Customer enters contact, address, requested date/time, and delivery notes
System validates required delivery fields
System creates order as delivery_requested
System does not create payment session
Customer sees delivery request confirmation
Admin reviews request
```

Rules:

- No payment record is required at request submission.
- Customer-facing copy must state that delivery is pending approval.
- Admin list must surface pending delivery requests separately from paid orders.

## Approval Flow

```text
Admin opens pending delivery request
Admin reviews address, requested timing, notes, items, and estimated total
Admin enters or confirms delivery fee and approval expiration
System calculates approved total
System marks order delivery_approved_payment_needed
System records status history
Customer receives or opens payment path
Customer reviews approved details and final total
Customer pays
Webhook marks order paid
```

Rules:

- Approved totals must be shown to the customer before payment.
- Approved details cannot materially change without reapproval.
- Payment must be blocked after expiration.

## Decline Flow

```text
Admin opens pending delivery request
Admin selects decline
Admin enters customer-visible reason or next step
System marks order delivery_declined
System records status history
Customer sees delivery unavailable status if they revisit the order
```

Rules:

- Declined delivery requests cannot be paid.
- Decline should not delete the order record.

## Pickup Offer Flow

```text
Admin opens pending delivery request
Admin selects offer pickup
Admin enters customer-visible note
System marks order pickup_offered
Customer accepts pickup
System converts order to pickup payment path
Customer pays
```

Rules:

- Customer acceptance is required before payment.
- Pickup offer must preserve order items and customer contact.

## Withdrawal Flow

```text
Admin opens approved unpaid delivery request
Admin withdraws approval
System marks order approval_withdrawn
System invalidates payment eligibility
System records status history
```

Rules:

- Withdrawal is only available before payment.
- Any existing unpaid provider session must no longer be trusted as payment-eligible.

## Expiration Flow

```text
Approved delivery request reaches approval expiration
System treats payment path as invalid
Customer attempting payment sees expired status
Admin may reapprove or ask customer to resubmit
```

Rules:

- Expiration can be enforced when loading the order or creating payment.
- Expired delivery requests cannot be paid until reapproved.

## Tenant Isolation Rule

Every flow must include the active tenant id at the service boundary. Admin actions must require tenant admin authorization. Public confirmation and payment paths must never expose another tenant's order data.
