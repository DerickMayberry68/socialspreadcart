# Order Flow Contract: Guest Ordering Payment

## Guest Flow

1. Guest views active Shayley menu items.
2. Guest adds item(s) to the **Order Tray**.
3. Guest reviews quantities, notes/options, and estimated total.
4. Guest enters required contact and fulfillment details, including enough location information to calculate applicable tax.
5. Server revalidates tenant, menu item availability, item prices, and order item snapshots.
6. Server calculates applicable tax from configured tax rules and fulfillment/location details.
7. Server calculates the non-taxable 2.6% gross-up processing fee.
8. Server creates a guest order and payment record in pending state with subtotal, tax, fee, and total stored separately.
9. Server creates hosted payment checkout with taxable menu item line items and one non-taxable processing-fee line item.
10. Guest is redirected to hosted payment checkout.
11. Payment completion returns guest to confirmation page.
12. Confirmation page clears the Order Tray and shows pending or paid order details while polling for final payment status.

## Payment Reconciliation Flow

1. Payment provider sends webhook event.
2. Webhook route verifies event authenticity.
3. Payment service finds the matching payment record and order.
4. Duplicate events are ignored safely.
5. Successful payment reconciles provider-confirmed subtotal, tax, non-taxable processing fee, total, session id, and payment intent id.
6. Successful payment updates payment record and guest order to paid.
7. Failed or cancelled payment leaves the order unpaid and visible only as non-paid state.

## Admin Fulfillment Flow

1. Authorized tenant admin opens the orders area.
2. Admin route verifies tenant admin access.
3. Order service returns only orders for the active tenant.
4. Admin sees guest contact, item snapshots, subtotal, tax, non-taxable processing fee, total, payment status, and fulfillment details.
5. Admin can move paid orders through fulfillment statuses in implementation scope.
