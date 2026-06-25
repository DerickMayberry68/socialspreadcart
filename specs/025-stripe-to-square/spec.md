# Feature Specification: Stripe To Square Payment Conversion

**Feature Branch**: `025-stripe-to-square`  
**Created**: 2026-06-23  
**Status**: Draft  
**Input**: User description: "Convert Shayley's website checkout from Stripe to Square. Her Square account, tax rate, and 2.5% online processing fee are already configured. Use Square for pickup checkout and approved delivery payments while preserving the existing Order Tray, tenant-scoped orders, admin order workflow, and payment confirmation behavior."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Pays For Pickup Through Square (Priority: P1)

A customer can select available menu items, submit pickup checkout details, review the final Square-calculated tax and 2.5% processing fee, pay through Square, and return to a clear website confirmation.

**Why this priority**: Pickup is the primary immediate-payment flow. The conversion is not successful unless customers can complete a new order without Stripe and Shayley receives a reliable paid order.

**Independent Test**: Can be fully tested in the payment provider's test environment by submitting a pickup order, completing payment, returning to the site, and confirming that the website and admin order show matching paid totals.

**Acceptance Scenarios**:

1. **Given** a customer has valid pickup items and checkout details, **When** they start payment, **Then** they are sent to a Square-hosted checkout showing the order items, configured tax, configured 2.5% processing fee, and final total.
2. **Given** the customer completes Square payment, **When** Square confirms the payment, **Then** the website order becomes paid and the customer sees the matching confirmation.
3. **Given** the customer cancels or fails to complete payment, **When** they return to the site, **Then** the order is not marked paid and they can safely retry without being charged twice.

---

### User Story 2 - Customer Pays For Approved Delivery Through Square (Priority: P2)

A customer whose delivery request has been approved can use the existing payment path to pay the approved delivery order through Square without changing the approved items, address, delivery fee, timing, or expiration rules.

**Why this priority**: Delivery payments already have approval safeguards that must remain intact during the provider conversion.

**Independent Test**: Can be tested by submitting a delivery request, approving it in admin, opening the approved payment path, completing Square payment, and verifying the approved details and paid status are preserved.

**Acceptance Scenarios**:

1. **Given** an approved and unexpired delivery request, **When** the customer starts payment, **Then** Square checkout shows the approved items, delivery fee, configured tax, configured processing fee, and final total.
2. **Given** the customer pays the approved delivery order, **When** payment confirmation is received, **Then** the order becomes paid and retains the approved delivery details.
3. **Given** a delivery approval is expired, declined, withdrawn, materially changed, or already paid, **When** a customer attempts to start payment, **Then** no new Square checkout is created.

---

### User Story 3 - Shayley Reconciles Square Orders In Admin (Priority: P3)

Shayley can use the existing admin Orders view to see Square-paid orders with accurate subtotal, tax, processing fee, delivery fee, total, payment status, and non-sensitive Square references.

**Why this priority**: Shayley needs one operational order workflow regardless of which payment system processed historical or current orders.

**Independent Test**: Can be tested by completing Square pickup and delivery payments, then confirming both appear in admin with totals matching Square and without exposing payment credentials.

**Acceptance Scenarios**:

1. **Given** Square confirms a payment, **When** Shayley opens admin Orders, **Then** the order appears paid with totals matching Square.
2. **Given** an order was historically paid through Stripe, **When** Shayley opens admin Orders after the conversion, **Then** the historical order remains visible and unchanged.
3. **Given** duplicate or repeated Square payment notifications arrive, **When** they are processed, **Then** the order and payment history are updated only once for the same payment event.

---

### User Story 4 - Business Activates Square Safely (Priority: P4)

The business can validate the complete payment flow in a test environment before enabling Square for real customers, and can cut over without creating duplicate or orphaned payments.

**Why this priority**: Payment-provider changes carry financial and operational risk. A controlled activation protects customers and preserves order history.

**Independent Test**: Can be tested by completing the acceptance suite with test payments, activating production credentials, placing one small live order, and confirming all website, Square, and admin records agree.

**Acceptance Scenarios**:

1. **Given** Square is configured for testing, **When** test payments are completed, **Then** no real funds are moved and all customer/admin behaviors can be verified.
2. **Given** production activation has not been completed, **When** a customer attempts checkout, **Then** the site does not silently attempt a real Square payment with incomplete configuration.
3. **Given** Square production activation is complete, **When** a new customer starts checkout, **Then** the new payment uses Square rather than Stripe.
4. **Given** a Stripe payment attempt began before cutover, **When** the transition occurs, **Then** it is either safely reconciled during a limited transition period or explicitly invalidated and replaced without allowing duplicate payment.

### Edge Cases

- Square checkout creation is unavailable or times out; the order must not be marked paid, and the customer must receive a clear retry message.
- Square applies a tax or processing-fee total that differs from a website estimate; Square's final order totals must be recorded and shown consistently after checkout.
- A customer opens the same payment action multiple times; each payable order must remain protected against duplicate successful payment.
- A payment succeeds but the customer closes the browser before returning to the website; the payment confirmation must still update the order.
- A Square payment notification is delayed, repeated, delivered out of order, or has an invalid signature; invalid notifications must be rejected and valid repeated notifications must be idempotent.
- A Square payment is later refunded or cancelled; the stored payment status must be capable of reflecting the provider-confirmed outcome without deleting the order.
- The configured Square location, tax, or 2.5% processing fee is missing or inactive; production checkout must stop with an actionable configuration error rather than charge an incorrect amount.
- Historical Stripe orders and payment references must remain readable after new Stripe checkout creation is disabled.
- A pending Stripe payment link exists at cutover; the transition must prevent both the old Stripe link and a replacement Square link from successfully charging the same order.
- Another tenant uses a different payment configuration; Shayley's Square credentials and payment records must not be exposed across tenants.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All newly initiated online payments for Shayley's active tenant MUST use Square after production activation.
- **FR-002**: The customer-facing Order Tray, checkout details, pickup workflow, delivery approval workflow, confirmation experience, and admin fulfillment workflow MUST continue to operate without requiring customers or admins to learn a replacement order process.
- **FR-003**: Pickup customers MUST be able to pay through a Square-hosted checkout without creating a Square account.
- **FR-004**: Approved delivery customers MUST be able to pay through Square only while the existing delivery approval remains valid and payable.
- **FR-005**: Square checkout MUST show the purchased items, configured sales tax, configured 2.5% online processing fee, delivery fee when applicable, and final payable total before the customer authorizes payment.
- **FR-006**: The website MUST stop calculating or adding the former 2.6% Stripe processing fee after Square is enabled.
- **FR-007**: Square's configured tax and 2.5% online processing fee MUST be the source of truth for Square checkout totals.
- **FR-008**: The system MUST persist the final Square-confirmed subtotal, tax, processing fee, delivery fee, total, currency, payment status, and non-sensitive provider references for reconciliation.
- **FR-009**: An order MUST be marked paid only after an authentic Square payment confirmation indicates successful payment.
- **FR-010**: Payment confirmation MUST succeed even when the customer does not return to the website after paying.
- **FR-011**: Invalid payment notifications MUST be rejected without changing an order.
- **FR-012**: Repeated or out-of-order payment notifications MUST NOT create duplicate payment records, duplicate status-history entries for the same event, or duplicate charges.
- **FR-013**: Failed, cancelled, incomplete, expired, or otherwise unsuccessful Square payments MUST NOT mark an order paid.
- **FR-014**: The system MUST prevent payment for delivery requests that are unapproved, expired, declined, withdrawn, materially changed after approval, or already paid.
- **FR-015**: The system MUST preserve existing tenant scoping for orders, payment records, delivery details, and admin visibility.
- **FR-016**: Sensitive Square credentials MUST remain private and MUST NOT be exposed to customers, public pages, client-visible application data, logs, or stored order records.
- **FR-017**: The business MUST be able to test pickup, approved delivery, successful payment, failed payment, cancelled payment, duplicate notification, and customer-no-return scenarios without moving real funds.
- **FR-018**: Production checkout MUST remain disabled when required Square production configuration is missing or inconsistent.
- **FR-019**: Historical Stripe orders and payment records MUST remain visible and unchanged in admin after Square activation.
- **FR-020**: New Stripe checkout creation MUST be disabled after Square production activation.
- **FR-021**: Any Stripe payment attempt still pending at cutover MUST be handled through a documented transition rule that prevents both Stripe and Square from successfully charging the same order.
- **FR-022**: Shayley MUST be able to identify whether a payment was processed by Square or Stripe when reviewing reconciliation details.
- **FR-023**: The production activation process MUST include one verified low-value live payment whose Square record, website confirmation, stored totals, and admin order all match before the conversion is considered complete.
- **FR-024**: The system MUST preserve the existing customer-visible processing-fee label unless Shayley requests different wording.
- **FR-025**: The customer checkout and confirmation flows MUST continue to work on common mobile and desktop screen sizes.
- **FR-026**: Square checkout MUST NOT collect optional tips in this release because the existing order and approved-delivery totals do not include a tip amount.

### Key Entities

- **Guest Order**: The existing tenant-scoped customer order containing contact, fulfillment, item, total, and operational status details.
- **Square Checkout**: A hosted payment opportunity for one specific payable guest order, including the final Square-calculated price adjustments and customer redirect.
- **Payment Record**: A provider-neutral reconciliation record containing the processor name, non-sensitive provider references, confirmed amounts, currency, payment status, and latest processed event reference.
- **Payment Notification**: A provider-signed status update used to reconcile a payment independently of the customer's browser return.
- **Payment Configuration**: The active environment, business location, tax behavior, processing-fee behavior, credentials, and activation state required to create and verify payments.
- **Provider Transition**: The controlled period in which new payments move to Square while historical and outstanding Stripe activity remains protected from duplication.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new pickup and approved-delivery acceptance-test payments use Square after Square activation.
- **SC-002**: 100% of successful Square test payments produce a paid website order with subtotal, tax, processing fee, delivery fee when applicable, and total matching Square.
- **SC-003**: 0 failed, cancelled, expired, unapproved, withdrawn, duplicate, or invalidly notified payment attempts are incorrectly marked paid during acceptance testing.
- **SC-004**: A customer can complete a standard pickup order from payment start to website confirmation in under 3 minutes during normal operation.
- **SC-005**: 100% of successful payments update the order even when the customer does not return to the website after payment.
- **SC-006**: 100% of historical Stripe orders remain visible with unchanged payment status and totals after Square activation.
- **SC-007**: Replaying the same valid Square payment notification at least three times produces one effective payment reconciliation outcome.
- **SC-008**: Shayley can locate a new Square-paid order and verify its customer, items, totals, provider, and fulfillment status in admin within 1 minute.
- **SC-009**: The production trial payment has matching values in Square, the website confirmation, stored payment record, and admin Orders view before general customer activation.

## Assumptions

- Shayley's Square seller account and Square developer application already exist.
- Sandbox application credentials and a Sandbox location are available locally for implementation and testing.
- Shayley's Square sales tax is configured to apply to custom amounts used by website-created orders.
- Shayley's 2.5% online processing fee is configured to apply automatically to Square Payment Links and has the intended taxable or non-taxable setting.
- Square is the source of truth for tax, the configured online processing fee, and final payable totals after the conversion.
- The existing website database, Order Tray, guest order records, delivery approval states, confirmation screens, admin Orders view, and tenant authorization remain in place.
- Version 1 uses Square-hosted checkout rather than embedding payment-card fields directly in the website.
- Optional tipping is outside this release and remains disabled so the approved website total matches the Square payable total.
- Version 1 does not migrate historical Stripe transactions into Square; it preserves their existing provider references and order history.
- Refund initiation from the website admin is outside this feature; provider-confirmed refund status may still be recorded when received.
- Multi-tenant Square onboarding through seller authorization is outside this feature because this conversion targets Shayley's existing tenant and Square account.
- Production credentials and production notification settings will be added only after Sandbox acceptance passes.
