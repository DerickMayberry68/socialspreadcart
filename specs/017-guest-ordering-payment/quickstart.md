# Quickstart: Guest Ordering Payment

## Prerequisites

- Supabase environment variables configured for the app.
- Payment provider secret key and webhook signing secret configured in local/deployed environment.
- At least one active Shayley menu item with a positive `price_cents`.
- Active tenant resolution for Shayley's public site.

## Validation Steps

1. Run database migration for guest orders, order items, and payment records.
2. Start the app with `npm run dev`.
3. Visit Shayley's public menu page.
4. Add one active menu item to the **Order Tray**.
5. Open the Order Tray and verify item name, quantity, unit price, and total.
6. Continue to checkout and submit guest name, contact method, and fulfillment details.
7. Complete payment with provider test credentials.
8. Return to confirmation and verify the order shows paid status and matching total.
9. Sign in as Shayley's tenant admin and open the admin orders page.
10. Verify the paid order appears with guest contact details, item snapshots, total, payment status, and fulfillment details.
11. Attempt a failed/cancelled payment and verify the order is not marked paid.

## Required Verification Commands

```powershell
npm test
npx tsc --noEmit
```

If PowerShell blocks npm/npx shims, run the same commands through an execution-policy bypass shell.
