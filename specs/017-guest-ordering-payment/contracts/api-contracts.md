# API Contracts: Guest Ordering Payment

These contracts describe route behavior for implementation and testing. They are intentionally service-backed; pages and components must not call Supabase or payment SDKs directly.

## POST /api/checkout

Creates a tenant-scoped guest order in `payment_pending` state and starts hosted payment checkout.

**Request Body**:

```json
{
  "tenantId": "uuid",
  "items": [
    {
      "menuItemId": "string",
      "quantity": 1,
      "notes": "No nuts",
      "options": {}
    }
  ],
  "guest": {
    "name": "Jane Guest",
    "email": "jane@example.com",
    "phone": "555-123-4567"
  },
  "fulfillment": {
    "type": "pickup",
    "requestedAt": "2026-05-01T17:00:00.000Z",
    "notes": "Pickup at the front table",
    "address": {
      "line1": "100 Main St",
      "line2": null,
      "city": "Bentonville",
      "state": "AR",
      "postalCode": "72712",
      "country": "US"
    }
  }
}
```

**Success Response**:

```json
{
  "orderId": "uuid",
  "paymentStatus": "pending",
  "totals": {
    "subtotalCents": 4500,
    "taxCents": 438,
    "feeCents": 132,
    "totalCents": 5070,
    "currency": "usd"
  },
  "checkoutUrl": "https://payment-provider.example/session"
}
```

**Failure Responses**:
- `400`: empty Order Tray, invalid guest details, invalid fulfillment details, or unavailable item.
- `422`: tax/fee calculation could not be completed from the submitted fulfillment/location details.
- `409`: item price or availability changed and the guest must review the Order Tray again.
- `500`: checkout could not be started.

## GET /api/checkout/confirm?orderId={orderId}

Returns the tenant-scoped checkout confirmation state for the guest after payment redirect.

**Success Response**:

```json
{
  "orderId": "uuid",
  "status": "paid",
  "paymentStatus": "paid",
  "totals": {
    "subtotalCents": 4500,
    "taxCents": 438,
    "feeCents": 132,
    "totalCents": 5070,
    "currency": "usd"
  },
  "items": [
    {
      "name": "Classic Spread",
      "quantity": 1,
      "lineTotalCents": 4500
    }
  ],
  "fulfillment": {
    "type": "pickup",
    "requestedAt": "2026-05-01T17:00:00.000Z"
  }
}
```

**Failure Responses**:
- `404`: order not found for the active tenant.
- `409`: payment has not completed yet.

## POST /api/webhooks/stripe

Receives payment provider events and updates order/payment status idempotently.

**Behavior**:
- Verify webhook signature before reading event details.
- Ignore duplicate event ids already applied to the payment record.
- Mark matching payment/order paid only when provider status confirms payment completion.
- Reconcile provider-confirmed subtotal, tax, non-taxable processing fee, and total values to the local order/payment record.
- Mark matching payment/order failed or cancelled on terminal failure/cancel events.

**Responses**:
- `200`: event accepted or duplicate safely ignored.
- `400`: invalid signature or unsupported payload.
- `404`: referenced local order/payment record not found.

## GET /api/admin/orders

Returns tenant-scoped guest orders for the authenticated admin.

**Behavior**:
- Must start with tenant-admin authorization.
- Must only return orders for the current tenant.
- Supports filtering by fulfillment/payment status in implementation if needed for the admin view.

**Success Response**:

```json
{
  "orders": [
    {
      "id": "uuid",
      "guestName": "Jane Guest",
      "subtotalCents": 4500,
      "taxCents": 438,
      "feeCents": 132,
      "totalCents": 5070,
      "paymentStatus": "paid",
      "status": "paid",
      "createdAt": "2026-04-28T15:00:00.000Z",
      "items": [
        {
          "name": "Classic Spread",
          "quantity": 1
        }
      ]
    }
  ]
}
```

**Failure Responses**:
- `401`: not authenticated.
- `403`: authenticated user is not a tenant admin.
