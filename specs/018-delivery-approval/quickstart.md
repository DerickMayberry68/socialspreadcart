# Quickstart: Delivery Approval Before Payment

## Client Review Checklist

Use this section with Shayley before implementation.

- Confirm pickup orders should continue to go straight to payment.
- Confirm delivery orders should always require approval before payment.
- Confirm the customer-facing labels:
  - `Delivery Requested`
  - `Delivery Approved - Payment Needed`
  - `Delivery Declined`
  - `Pickup Offered`
  - `Paid`
- Confirm whether Shayley wants to enter a delivery fee during approval.
- Confirm the default expiration window for approved unpaid delivery requests.
- Confirm whether the first implementation should email payment links or only show an admin/customer payment path.
- Confirm whether pickup-offered orders should require explicit customer acceptance before payment.

## Implementation Validation

Run after implementation:

```powershell
npm test
npx tsc --noEmit
```

If PowerShell blocks npm/npx shims, use:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm test"
powershell -ExecutionPolicy Bypass -Command "npx tsc --noEmit"
```

## Manual Acceptance Paths

### Pickup Still Pays Immediately

1. Add an available item to the Order Tray.
2. Choose pickup.
3. Enter valid contact and pickup timing.
4. Submit checkout.
5. Verify the response opens payment.
6. Complete payment.
7. Verify the order appears in admin as paid.

### Delivery Request Does Not Charge

1. Add an available item to the Order Tray.
2. Choose delivery.
3. Enter contact, delivery address, requested date/time, and notes.
4. Submit checkout.
5. Verify no payment session opens.
6. Verify confirmation says delivery is awaiting approval.
7. Verify admin shows the request as `Delivery Requested`.

### Admin Approves Delivery

1. Open admin orders.
2. Find the pending delivery request.
3. Approve it with an optional delivery fee and expiration.
4. Verify the order status becomes `Delivery Approved - Payment Needed`.
5. Open the customer payment path.
6. Verify approved delivery details and totals are shown before payment.
7. Complete payment.
8. Verify admin shows the order as paid with delivery details preserved.

### Admin Declines Delivery

1. Open a pending delivery request.
2. Decline it with a customer-visible reason.
3. Verify no payment path is available.
4. Verify the customer-facing order status shows delivery declined.

### Approval Cannot Be Paid After It Is Invalid

1. Approve a delivery request.
2. Withdraw approval or set expiration in the past.
3. Attempt to create or open payment.
4. Verify payment is blocked and the order remains unpaid.

### Tenant Isolation

1. Submit a delivery request for Shayley's tenant.
2. Sign in as another tenant admin.
3. Verify the request, address, contact details, and payment status are not visible.
