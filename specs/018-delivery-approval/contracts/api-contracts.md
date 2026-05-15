# API Contracts: Delivery Approval Before Payment

These contracts describe the expected behavior of the existing and new HTTP boundaries. Exact validation schemas should live in `src/lib/validation/order.ts`; data access and payment provider calls should live in services.

## POST /api/checkout

Submits a pickup checkout or delivery request from the public checkout form.

### Request

```json
{
  "tenantId": "uuid",
  "items": [
    {
      "menuItemId": "string",
      "quantity": 1,
      "notes": "optional string",
      "options": {}
    }
  ],
  "guest": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "5555555555"
  },
  "fulfillment": {
    "type": "pickup | delivery",
    "requestedAt": "2026-05-02T18:00:00.000Z",
    "notes": "Leave at side door",
    "address": {
      "line1": "123 Main St",
      "line2": "",
      "city": "Bentonville",
      "state": "AR",
      "postalCode": "72712",
      "country": "US"
    }
  }
}
```

### Pickup Success Response

```json
{
  "ok": true,
  "mode": "payment",
  "orderId": "uuid",
  "paymentStatus": "pending",
  "checkoutUrl": "https://payment-provider.example/session",
  "totals": {
    "subtotalCents": 5000,
    "taxCents": 475,
    "feeCents": 146,
    "deliveryFeeCents": 0,
    "totalCents": 5621,
    "currency": "usd"
  }
}
```

### Delivery Request Success Response

```json
{
  "ok": true,
  "mode": "delivery_request",
  "orderId": "uuid",
  "status": "delivery_requested",
  "paymentStatus": "not_started",
  "message": "Delivery requested. Shayley will approve delivery before payment.",
  "totals": {
    "subtotalCents": 5000,
    "estimatedTaxCents": 0,
    "estimatedFeeCents": 0,
    "estimatedDeliveryFeeCents": 0,
    "estimatedTotalCents": 5000,
    "currency": "usd"
  }
}
```

### Error Responses

- `400`: invalid guest, item, fulfillment, address, or requested timing data.
- `409`: item unavailable, order not eligible for payment, or delivery approval required before payment.
- `500`: unexpected service or persistence failure.

## GET /api/checkout/confirm

Confirms customer-visible order status after payment or delivery request submission.

### Query

- `tenantId`
- `orderId`

### Response

```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "fulfillmentType": "delivery",
    "status": "delivery_requested",
    "paymentStatus": "not_started",
    "deliveryStatus": "requested",
    "customerMessage": "Delivery is awaiting approval before payment.",
    "items": [],
    "totals": {
      "subtotalCents": 5000,
      "taxCents": 0,
      "feeCents": 0,
      "deliveryFeeCents": 0,
      "totalCents": 5000,
      "currency": "usd"
    }
  }
}
```

## POST /api/admin/orders/[id]/delivery-decision

Allows an authorized tenant admin to approve, decline, withdraw approval, or offer pickup for a delivery request.

### Guard

Route must start with tenant admin authorization and must short-circuit on guard errors.

### Request

```json
{
  "tenantId": "uuid",
  "decision": "approve | decline | offer_pickup | withdraw_approval",
  "note": "Customer-visible note or next step.",
  "deliveryFeeCents": 1000,
  "approvedFulfillmentRequestedAt": "2026-05-02T18:00:00.000Z",
  "approvalExpiresAt": "2026-05-01T18:00:00.000Z"
}
```

### Approve Response

```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "status": "delivery_approved_payment_needed",
    "paymentStatus": "not_started",
    "deliveryStatus": "approved_payment_needed",
    "approvalExpiresAt": "2026-05-01T18:00:00.000Z",
    "totals": {
      "subtotalCents": 5000,
      "taxCents": 475,
      "feeCents": 172,
      "deliveryFeeCents": 1000,
      "totalCents": 6647,
      "currency": "usd"
    }
  }
}
```

### Decline/Pickup/Withdraw Response

```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "status": "delivery_declined",
    "paymentStatus": "not_started",
    "deliveryStatus": "declined",
    "customerMessage": "Delivery is not available for that time."
  }
}
```

### Error Responses

- `400`: invalid decision, missing required note, invalid fee, or invalid expiration.
- `401`/`403`: missing or unauthorized tenant admin.
- `404`: order not found for tenant.
- `409`: order is already paid, expired, cancelled, or not in a state that allows the requested decision.

## POST /api/checkout/delivery-payment

Creates a payment session for an approved delivery request.

### Request

```json
{
  "tenantId": "uuid",
  "orderId": "uuid"
}
```

### Success Response

```json
{
  "ok": true,
  "checkoutUrl": "https://payment-provider.example/session",
  "paymentStatus": "pending",
  "totals": {
    "subtotalCents": 5000,
    "taxCents": 475,
    "feeCents": 172,
    "deliveryFeeCents": 1000,
    "totalCents": 6647,
    "currency": "usd"
  }
}
```

### Error Responses

- `404`: approved delivery order not found for tenant.
- `409`: order is not approved, approval expired, approval withdrawn, already paid, or totals changed after approval.

## GET /api/admin/orders

Returns tenant-scoped admin order list including pickup orders, delivery requests, and payment states.

### Query

- `status=all | delivery_requested | delivery_approved_payment_needed | delivery_declined | paid | preparing | fulfilled | cancelled`

### Response Requirements

Each order summary must include:

- fulfillment type
- delivery status when applicable
- payment status
- guest contact
- requested delivery date/time
- delivery address summary
- item summary
- totals
- approval expiration when applicable
- latest customer-visible note

## Stripe Webhook Behavior

Webhook reconciliation must:

- Mark orders paid only when the payment provider confirms payment.
- Refuse to mark delivery orders paid if they are not approved and payment-eligible.
- Preserve final paid totals on order and payment records.
- Record status history for paid, failed, cancelled, and expired payment outcomes.
