# Order Flow Contract: Guest Ordering Payment

## Guest Flow

1. Guest views active Shayley menu items.
2. Guest adds item(s) to the **Order Tray**.
3. Guest reviews quantities, notes/options, and estimated total.
4. Guest enters required contact and fulfillment details.
5. Server revalidates tenant, menu item availability, item prices, and final total.
6. Server creates a guest order and payment record in pending state.
7. Guest is redirected to hosted payment checkout.
8. Payment completion returns guest to confirmation page.
9. Confirmation page shows paid order details after the server confirms payment state.

## Payment Reconciliation Flow

1. Payment provider sends webhook event.
2. Webhook route verifies event authenticity.
3. Payment service finds the matching payment record and order.
4. Duplicate events are ignored safely.
5. Successful payment updates payment record and guest order to paid.
6. Failed or cancelled payment leaves the order unpaid and visible only as non-paid state.

## Admin Fulfillment Flow

1. Authorized tenant admin opens the orders area.
2. Admin route verifies tenant admin access.
3. Order service returns only orders for the active tenant.
4. Admin sees guest contact, item snapshots, totals, payment status, and fulfillment details.
5. Admin can move paid orders through fulfillment statuses in implementation scope.
