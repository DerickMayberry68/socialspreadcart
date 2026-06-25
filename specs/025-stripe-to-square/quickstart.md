# Quickstart: Stripe To Square Payment Conversion

## Implementation Verification - June 23, 2026

- Square Sandbox location lookup succeeded for an active USD location with card-processing capability.
- A disposable API-created Payment Link confirmed that Dashboard Payment Link settings are not inherited automatically by custom API orders.
- An explicit `SQUARE_PROCESSING_FEE_PERCENT=2.5` Square Order service charge produced a 25-cent fee on a $10 test subtotal. The disposable link was deleted immediately.
- Created the Sandbox catalog tax `Social Spread Sales Tax` at 9.5%, additive, enabled, and applicable to custom amounts at the configured location.
- A disposable $10.00 Payment Link returned $0.95 tax, $0.25 processing fee, and an $11.20 total. The validation link was deleted immediately.
- Vercel preview deployment completed at `https://socialspreadcart-orsc39sfg-derick-mayberrys-projects.vercel.app`.
- The preview is protected by Vercel authentication, so Square cannot deliver external webhook events to it.
- Created a disabled Square Sandbox webhook subscription for `https://www.socialspreadnwa.com/api/webhooks/square` with `payment.updated` and `refund.updated`; its signature key and exact notification URL are saved only in ignored `.env.local`.
- The Square reconciliation migration was applied directly to linked Supabase project `zlygobftlioxoirietgh` and recorded as migration `20260624025854`.
- Remote verification confirmed the payment columns, five indexes, RLS, tenant-admin read policy, authenticated select grant, and service-role CRUD grant.
- `npm run audit:stripe-pending` found four historical pending database records and zero actionable Stripe Checkout sessions.
- Focused payment tests, the full 132-test suite, TypeScript, `git diff --check`, and the Next.js production build pass.
- Vercel environment configuration, enabling the Sandbox subscription, full payment/refund acceptance, and production activation remain pending.

## 1. Prerequisites

- Feature branch `025-stripe-to-square`.
- Existing Supabase project and order migrations applied.
- Square Sandbox application ID, access token, and location ID.
- Square tax enabled for custom amounts.
- A Square catalog tax enabled for custom amounts in the current environment. Sandbox and production catalogs must each be configured.
- `SQUARE_PROCESSING_FEE_PERCENT=2.5` configured so Square calculates the non-taxable online processing service charge.

## 2. Local Environment

Use `.env.local`:

```text
PAYMENT_PROVIDER=square
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=<sandbox application id>
SQUARE_ACCESS_TOKEN=<sandbox access token>
SQUARE_LOCATION_ID=<sandbox location id>
SQUARE_WEBHOOK_SIGNATURE_KEY=<add after webhook subscription exists>
SQUARE_WEBHOOK_NOTIFICATION_URL=<exact deployed sandbox webhook URL>
CHECKOUT_SUCCESS_URL=http://localhost:3000/checkout/confirmation
CHECKOUT_CANCEL_URL=http://localhost:3000/order-tray
```

Do not commit `.env.local`.

## 3. Install And Validate

```powershell
npm install
npm test
npx tsc --noEmit
npm run build
```

Perform one read-only Square location lookup using the configured Sandbox credentials and confirm the returned location matches `SQUARE_LOCATION_ID`.

## 4. Apply Database Migration

Apply the feature migration to the linked Supabase project, then verify:

- Square provider reference columns exist.
- `payment_webhook_events` exists.
- RLS is enabled.
- Tenant admins can read only their tenant records.
- Anonymous and ordinary authenticated users cannot read payment event records.

## 5. Create Sandbox Webhook

Deploy a preview containing `/api/webhooks/square`.

In Square Developer Console:

1. Select the application.
2. Select Sandbox.
3. Add the exact preview notification URL:

```text
https://<preview-host>/api/webhooks/square
```

4. Subscribe to:
   - `payment.updated`
   - `refund.updated`
5. Save the returned Sandbox signature key.
6. Set the exact same URL and key in preview environment variables.
7. Redeploy after environment-variable changes.

## 6. Sandbox Acceptance

### Pickup

1. Add a menu item to Order Tray.
2. Submit pickup checkout.
3. Confirm Square page shows item subtotal, tax, 2.5% processing fee, and total.
4. Complete with a Square Sandbox test card.
5. Confirm website order, payment record, confirmation, and admin Orders totals match Square.

### Cancel/Failure

1. Cancel one checkout.
2. Exercise a failed Sandbox payment.
3. Confirm neither order is marked paid.
4. Retry and confirm no duplicate payment is created.

### Customer Does Not Return

1. Complete payment.
2. Close Square checkout instead of following the website redirect.
3. Confirm the webhook still marks the order paid.

### Approved Delivery

1. Submit a delivery request.
2. Approve it with a delivery fee.
3. Start payment.
4. Confirm Square shows item subtotal, separate delivery fee, tax, processing fee, and total.
5. Complete payment and verify approved delivery details remain intact.

### Invalid Delivery Link

1. Create an approved delivery Payment Link.
2. Withdraw or expire the approval.
3. Confirm the Square link is deleted and can no longer accept payment.

### Idempotency

1. Replay the same valid Square webhook at least three times.
2. Confirm one event-ledger record and one effective order transition.

## 7. Stripe Transition Audit

Before production Square activation:

1. Query pending Stripe payment records.
2. Confirm every associated Stripe Checkout session is paid, expired, or explicitly expired.
3. Do not issue a Square link for an order with an actionable Stripe link.
4. Keep the Stripe webhook configured during the transition window.
5. Record the time when pending Stripe sessions reach zero.

## 8. Production Activation

1. Add production Square access token and location ID in Vercel.
2. Create the production Square webhook subscription using:

```text
https://www.socialspreadnwa.com/api/webhooks/square
```

3. Add its production signature key and exact notification URL.
4. Set:

```text
PAYMENT_PROVIDER=square
SQUARE_ENVIRONMENT=production
```

5. Deploy.
6. Complete one low-value live pickup order.
7. Verify Square payment, webhook log, website confirmation, database totals, owner notification, and admin Orders entry all match.
8. Only then allow general customer use.

## 9. Rollback

If production verification fails:

1. Set `PAYMENT_PROVIDER=disabled`.
2. Redeploy to prevent new payment creation.
3. Leave webhooks enabled so already-completed provider payments can reconcile.
4. Investigate before restoring any provider.
