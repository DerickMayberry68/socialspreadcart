# Quickstart: Guest Ordering Payment

## Prerequisites

- Supabase environment variables configured for the app.
- Payment provider secret key and webhook signing secret configured in local/deployed environment.
- Stripe Tax enabled and configured in the Stripe account.
- Tax code selected for menu items, or a Stripe default product tax code configured for the account.
- Processing fee tax treatment configured as non-taxable in implementation (`txcd_00000000` when using Stripe Tax).
- At least one active Shayley menu item with a positive `price_cents`.
- Active tenant resolution for Shayley's public site.

## Validation Steps

1. Run database migration for guest orders, order items, and payment records.
2. Start the app with `npm run dev`.
3. Visit Shayley's public menu page.
4. Add one active menu item to the **Order Tray**.
5. Open the Order Tray and verify item name, quantity, unit price, and total.
6. Continue to checkout and submit guest name, contact method, and fulfillment/location details.
7. Verify checkout shows subtotal, calculated tax, non-taxable processing fee, and final total before payment.
8. Confirm the processing fee follows the 2.6% gross-up target and is not included in taxable amount.
9. Complete payment with provider test credentials.
10. Return to confirmation and verify the order clears the Order Tray, then updates from pending to paid when the webhook completes.
11. Verify the confirmed paid total matches the Stripe payment amount and includes subtotal, tax, fee, and total.
12. Sign in as Shayley's tenant admin and open the admin orders page.
13. Verify the paid order appears with guest contact details, item snapshots, subtotal, tax, non-taxable processing fee, total, payment status, and fulfillment details.
14. Attempt a failed/cancelled payment and verify the order is not marked paid.
15. Verify the Stripe webhook delivery succeeded for the production domain.

## Required Verification Commands

```powershell
npm test
npx tsc --noEmit
```

If PowerShell blocks npm/npx shims, run the same commands through an execution-policy bypass shell.
