# Feature Specification: Guest Ordering Payment

**Feature Branch**: `017-guest-ordering-payment`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "I need to spec creating a checkout cart for Shayley to be able to allow guest to order and pay through the site. Obviously the site is a Food/Beverage cart so lets name it something not to be confusing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Places And Pays For An Order (Priority: P1)

A guest visiting Shayley's site can choose available food and beverage items, add them to an **Order Tray**, review their selections, provide contact and fulfillment details, pay online, and receive a clear confirmation.

**Why this priority**: This is the core customer and business value. Without a complete guest order and payment flow, Shayley cannot accept paid orders through the site.

**Independent Test**: Can be fully tested by starting as an unauthenticated site visitor, adding one available item to the Order Tray, completing required checkout details, submitting payment, and receiving an order confirmation.

**Acceptance Scenarios**:

1. **Given** a guest is viewing Shayley's available menu items, **When** they add an item to the Order Tray, **Then** the site shows the selected item, quantity, price, and current order total.
2. **Given** a guest has one or more items in the Order Tray, **When** they review and pay for the order with valid required details, **Then** the order is recorded as paid and the guest sees a confirmation with order summary and next steps.
3. **Given** a guest has an empty Order Tray, **When** they attempt to continue to checkout, **Then** the site prevents checkout and clearly asks them to add an item first.

---

### User Story 2 - Guest Adjusts Order Before Payment (Priority: P2)

A guest can change quantities, remove items, and review any item options or notes before payment so they do not pay for the wrong order.

**Why this priority**: Food and beverage orders often change before checkout. Guests need control before committing payment, and Shayley needs accurate order details.

**Independent Test**: Can be tested by adding multiple items, changing quantities and notes, removing one item, and confirming that totals and checkout details update before payment.

**Acceptance Scenarios**:

1. **Given** the Order Tray contains multiple items, **When** the guest changes a quantity or removes an item, **Then** the order summary and totals update before payment.
2. **Given** an item supports guest notes or options, **When** the guest enters a note or chooses an option, **Then** the final order summary includes those details for fulfillment.

---

### User Story 3 - Shayley Receives Paid Order Details (Priority: P3)

Shayley or an authorized tenant admin can see paid orders with enough detail to prepare and fulfill them, including guest contact details, ordered items, payment status, and fulfillment timing.

**Why this priority**: Payment alone is not enough. Shayley needs a reliable operational view of what was ordered and how to contact the guest.

**Independent Test**: Can be tested by completing a paid guest order and verifying that an authorized admin can find the order details and mark progress without exposing orders to other tenants.

**Acceptance Scenarios**:

1. **Given** a guest completes a paid order, **When** Shayley views incoming orders, **Then** the order appears with guest contact, item details, totals, payment status, and fulfillment information.
2. **Given** an order belongs to Shayley's tenant account, **When** another tenant admin views their orders, **Then** Shayley's order is not visible to that other tenant.

### Edge Cases

- A guest starts checkout and an item becomes unavailable before payment; the site must stop payment, explain which item changed, and let the guest update the Order Tray.
- A payment is declined or cancelled; the site must not mark the order as paid and must let the guest retry or return to the Order Tray.
- A guest refreshes or leaves the checkout page before payment; the unpaid Order Tray may be recoverable for the same browsing session, but it must not create a paid order.
- A duplicate payment submission occurs; the guest must not be charged twice for the same order.
- A guest enters missing or invalid contact or fulfillment details; checkout must identify the fields that need correction before payment.
- Order total changes because of item quantity, item availability, taxes, fees, or fulfillment selection; the guest must see the final total before payment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST provide a customer-facing **Order Tray** for selected items and MUST avoid using "cart" as the visible name for this ordering surface.
- **FR-002**: Guests MUST be able to add available Shayley menu items to the Order Tray without creating an account or signing in.
- **FR-003**: Guests MUST be able to view each selected item, quantity, item price, item options or notes when applicable, subtotal, fees or taxes when applicable, and final total before payment.
- **FR-004**: Guests MUST be able to change item quantities and remove items from the Order Tray before payment.
- **FR-005**: The site MUST prevent checkout when the Order Tray is empty or when selected items are no longer available for guest ordering.
- **FR-006**: Checkout MUST collect the guest's name, contact method, and required fulfillment details before payment.
- **FR-007**: Checkout MUST present the final payable total before the guest authorizes payment.
- **FR-008**: The site MUST allow guests to pay online for the finalized order and MUST clearly communicate payment success, payment failure, or cancellation.
- **FR-009**: The system MUST create an order record only when the guest submits checkout details, and MUST mark the order as paid only after payment is confirmed.
- **FR-010**: Guests MUST receive an on-screen confirmation after successful payment that includes the order summary, payment status, and fulfillment next steps.
- **FR-011**: Shayley or an authorized tenant admin MUST be able to view paid guest orders with guest contact information, ordered items, item notes/options, total, payment status, and fulfillment status.
- **FR-012**: Orders MUST remain tenant-scoped so Shayley's customer orders and payment information are not visible to other tenant accounts.
- **FR-013**: The system MUST protect against duplicate payment submission for the same order.
- **FR-014**: The system MUST preserve enough payment reference information to reconcile paid orders without exposing sensitive payment credentials.
- **FR-015**: The order flow MUST work on common mobile and desktop screen sizes because guests may order from phones while browsing the public site.

### Key Entities

- **Order Tray**: A guest's temporary collection of selected items before payment; includes selected menu items, quantities, notes/options, and calculated totals.
- **Guest Order**: A submitted customer order for Shayley; includes guest contact details, ordered items, totals, payment status, fulfillment status, and tenant ownership.
- **Order Item**: A single selected menu item within an order; includes name, quantity, item price at time of order, and any notes or options.
- **Payment Record**: A reconciliation record for a guest order payment; includes amount, status, timestamps, and non-sensitive payment reference information.
- **Fulfillment Details**: Guest-provided timing and handoff information needed to prepare and complete the order.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of test guests can add an item, review the Order Tray, complete checkout details, and reach payment confirmation without assistance.
- **SC-002**: Guests can complete a single-item order from first add to confirmation in under 3 minutes during normal site operation.
- **SC-003**: 100% of successfully paid orders appear in Shayley's order view with matching guest contact, item details, total, and paid status.
- **SC-004**: Failed, cancelled, or abandoned payments result in 0 orders incorrectly marked as paid during acceptance testing.
- **SC-005**: Guest order totals shown before payment match the confirmed paid order total in 100% of acceptance test cases.
- **SC-006**: Shayley can identify and start fulfilling a new paid order within 1 minute of the guest completing payment.

## Assumptions

- "Shayley" refers to the active tenant/client site context, and orders belong only to that tenant.
- The customer-facing selected-items surface will be named **Order Tray** for this feature to avoid confusion with the Food/Beverage cart concept and the SocialSpreadCart product name.
- Guest ordering is for unauthenticated public visitors; admin order management remains restricted to authorized tenant admins.
- Version 1 focuses on online paid orders for available menu items already published to the public site.
- Fulfillment is assumed to require customer contact details and a handoff time or instructions; exact pickup, delivery, or event fulfillment options can be refined during planning.
- Sensitive payment credentials are never stored by the site; only order-safe payment status and reconciliation references are retained.
