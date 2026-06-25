# API Contracts: Stripe To Square Payment Conversion

## POST `/api/checkout`

Existing request shape remains unchanged.

### Pickup Success

```json
{
  "mode": "payment",
  "orderId": "uuid",
  "paymentStatus": "pending",
  "totals": {
    "subtotalCents": 5000,
    "taxCents": 475,
    "feeCents": 137,
    "deliveryFeeCents": 0,
    "totalCents": 5612,
    "currency": "usd"
  },
  "checkoutUrl": "https://square.link/..."
}
```

The returned totals are the Square Order totals created for the Payment Link.

### Delivery Request Success

Unchanged: delivery requests are recorded without creating a payment link.

### Errors

- `400`: invalid checkout data.
- `409`: item/order review required.
- `422`: Square returned invalid or inconsistent order totals.
- `503`: Square configuration missing or provider unavailable.

## POST `/api/checkout/delivery-payment`

Existing request shape remains unchanged.

### Success

Returns the same payment response as pickup with the approved `deliveryFeeCents`.

### Additional Rules

- No Payment Link is created for invalid delivery approval state.
- An existing active Square link can be returned safely for repeated requests.
- A superseded/invalid link is deleted before replacement.

## GET `/api/checkout/confirm?orderId={orderId}`

Existing response shape remains unchanged.

Rules:

- Browser return does not mark payment paid.
- If Square webhook processing is still pending, return the existing non-paid response until reconciliation completes.
- Paid confirmation uses persisted Square-confirmed totals.

## POST `/api/webhooks/square`

### Required Header

```text
x-square-hmacsha256-signature: <signature>
```

### Supported Events

- `payment.updated`
- `refund.updated`

### Success

```json
{
  "ok": true
}
```

Returns `200` for:

- Newly processed supported events.
- Duplicate already-processed events.
- Authenticated but unsupported event types.

### Errors

- `400`: malformed payload or missing signature.
- `403`: invalid Square signature.
- `500`: valid event could not be persisted/reconciled; Square may retry.

### Security Rules

- Read raw request text before validation.
- Validate against `SQUARE_WEBHOOK_NOTIFICATION_URL`, not an inferred proxy URL.
- Never log access tokens, signature keys, full authorization headers, or customer payment instrument details.

## POST `/api/webhooks/stripe`

Remains available during the transition window for sessions created before Square activation.

Rules:

- No new Stripe sessions are created when `PAYMENT_PROVIDER=square`.
- Historical Stripe reconciliation continues to use existing signature validation.
- Route removal occurs only after the pending Stripe session audit is zero.
