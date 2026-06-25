# Research: Stripe To Square Payment Conversion

## Decision 1: Use Square-hosted Payment Links with full Orders

**Decision**: Create Square-hosted checkout pages with a full Square Order containing the menu item snapshots, delivery fee when applicable, internal order reference, automatic tax pricing option, buyer prepopulation, and redirect URL.

**Rationale**: Hosted checkout preserves the current redirect-based customer flow and keeps card data out of the website. A full Order provides itemization, tax, service-charge, and total data needed for reconciliation. Square returns a Payment Link plus related Order resources.

**Alternatives considered**:

- **Quick Pay links**: Rejected because one aggregate amount loses item, tax, service-charge, and delivery-fee detail.
- **Embedded Web Payments fields**: Rejected for version 1 because it adds browser payment-tokenization and payment-method UI work without improving the current hosted-checkout experience.
- **Square Invoices**: Rejected because pickup orders need immediate checkout rather than invoice issuance and collection.

## Decision 2: Square owns tax and the configured 2.5% service charge

**Decision**: Enable Square automatic catalog tax application and add the confirmed 2.5% non-taxable processing percentage as an explicit Square Order service charge. Persist the returned Square Order totals rather than recreating the tax or former gross-up fee amount in application code.

**Rationale**: Shayley confirmed that tax applies to custom amounts and the online processing percentage is 2.5%. A live Sandbox API check on June 23, 2026 showed that API-created Payment Links do not inherit the Dashboard Payment Link service charge, so the request must identify the percentage explicitly. Square still calculates the fee amount and returns the authoritative tax, service-charge, and final totals.

**Configuration safeguard**: Checkout creation validates the returned Order. If expected automatic tax/service-charge behavior is absent, the new link is deleted and checkout fails with an actionable configuration error.

**Alternatives considered**:

- **Continue application-calculated 2.6% fee**: Rejected because it would duplicate or conflict with Square's configured 2.5% service charge.
- **Hardcode Shayley's tax percentage**: Rejected because the website would drift from Square configuration.
- **Use a separate tax service**: Rejected because Shayley confirmed Square's configured tax behavior is sufficient for this release.

## Decision 3: Model delivery fee as a separate fixed non-taxable service charge

**Decision**: For approved delivery orders, pass the approved delivery fee as a separately named fixed service charge marked non-taxable, distinct from Square's configured 2.5% online processing service charge.

**Rationale**: The existing order model stores delivery fee separately and treats it as non-taxable. Square Orders support multiple service charges and report their applied totals independently.

**Alternatives considered**:

- **Ad-hoc delivery line item**: Rejected because automatic custom-amount tax could tax it unintentionally.
- **Combine delivery and processing fees**: Rejected because the admin and customer views must preserve separate totals.

## Decision 4: Use Square Node SDK 44.2.0 behind a provider adapter

**Decision**: Add the exact Square Node SDK version `44.2.0` and initialize `SquareClient` lazily from server-only environment variables.

**Rationale**: The current official SDK exposes `SquareClient`, `SquareEnvironment`, checkout, orders, payments, refunds, and webhook utilities. Lazy initialization keeps builds safe when deployment credentials are unavailable at build time.

**Alternatives considered**:

- **Direct REST calls**: Rejected because the SDK provides current request/response types and webhook signature utilities.
- **Generic payment plugin framework**: Rejected as unnecessary for one active provider plus legacy Stripe reconciliation.

## Decision 5: Verify webhook signatures using exact raw inputs

**Decision**: Validate each webhook with the raw body, `x-square-hmacsha256-signature`, configured signature key, and the exact public notification URL.

**Rationale**: Square signs the concatenation of the configured notification URL and raw body. Parsing or reserializing the body before validation can invalidate the signature. The official SDK helper uses constant-time verification.

**Alternatives considered**:

- **Trust event IDs or source IPs**: Rejected because neither proves event authenticity.
- **Use the incoming request URL automatically**: Rejected because proxies and preview domains can differ from the URL registered in Square.

## Decision 6: Reconcile payment and refund updates through an event ledger

**Decision**: Subscribe to `payment.updated` and `refund.updated`; claim each provider event ID in a tenant-scoped event ledger before applying state changes.

**Rationale**: Square can deliver repeated and multiple events for one payment. A single `raw_event_id` column cannot safely deduplicate more than the most recently processed event. The ledger provides unique provider-event enforcement and retry visibility.

**Alternatives considered**:

- **Only compare `payment_records.raw_event_id`**: Rejected because replaying an older event after a newer event could be applied again.
- **Rely only on current payment status**: Rejected because it does not provide event-level idempotency or failed-processing auditability.

## Decision 7: Resolve orders from stored Square references

**Decision**: Store Square Payment Link ID and Square Order ID when checkout is created. Webhooks resolve the internal tenant/order from those persisted references; the internal order ID also populates Square's order reference for diagnostics.

**Rationale**: Provider references are stable and avoid trusting arbitrary webhook metadata for authorization or tenancy.

**Alternatives considered**:

- **Trust tenant ID embedded in provider metadata**: Rejected because tenancy must come from application-owned records.
- **Search orders by customer email**: Rejected because emails are not unique payment identifiers.

## Decision 8: Delete invalid delivery Payment Links

**Decision**: Delete an active Square Payment Link when delivery approval is withdrawn, declined, expires, or materially changes.

**Rationale**: Square documents that deleting a Payment Link cancels its corresponding order and removes the checkout URL. This enforces the website's delivery approval lifecycle at the provider.

**Alternatives considered**:

- **Only block the website button**: Rejected because an already shared Square URL could remain payable.
- **Create links only at the last possible moment**: Retained as normal behavior but insufficient once a link has already been issued.

## Decision 9: Cut over only with zero actionable Stripe sessions

**Decision**: Stop new Stripe session creation at activation, preserve historical Stripe records, and require pending Stripe sessions to expire or be explicitly expired before issuing a replacement Square link for the same order.

**Rationale**: Running two payable hosted links for one order creates a duplicate-charge race. A zero-pending-session gate is simpler and safer than dual-provider conflict resolution.

**Alternatives considered**:

- **Support simultaneous Stripe and Square payment links**: Rejected because provider webhooks cannot atomically prevent a customer from paying both external links.
- **Delete all Stripe history**: Rejected because admin reconciliation and audit history must remain intact.

## Primary References

- [Square Checkout API](https://developer.squareup.com/docs/checkout-api)
- [Manage Square Payment Links](https://developer.squareup.com/docs/checkout-api/manage-checkout)
- [Apply taxes and service charges](https://developer.squareup.com/docs/orders-api/apply-taxes-and-discounts)
- [Square Node SDK quickstart](https://developer.squareup.com/docs/sdks/nodejs/quick-start)
- [Verify Square webhook signatures](https://developer.squareup.com/docs/webhooks/step3validate)
- [Payments API webhooks](https://developer.squareup.com/docs/payments-api/webhooks)
- [Refunds API webhooks](https://developer.squareup.com/docs/refunds-api/webhooks)
