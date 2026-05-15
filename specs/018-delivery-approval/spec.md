# Feature Specification: Delivery Approval Before Payment

**Feature Branch**: `018-delivery-approval`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "The client delivers, but we need a safe way to handle delivery for online purchases. If a customer selects Delivery, Shayley should approve it before payment so the customer is not charged before she confirms availability, event conflicts, delivery capacity, distance, and any delivery fee."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Requests Delivery Without Paying First (Priority: P1)

A customer with items in the Order Tray can choose delivery, provide delivery details, review that delivery requires approval, and submit a delivery request without being charged.

**Why this priority**: This prevents customers from paying for delivery orders that Shayley may not be able to fulfill because of availability, event commitments, delivery distance, or delivery volume.

**Independent Test**: Can be fully tested by adding an item to the Order Tray, choosing delivery, submitting required delivery details, and confirming that the request is recorded with no payment collected.

**Acceptance Scenarios**:

1. **Given** a customer has items in the Order Tray, **When** they choose delivery during checkout, **Then** the checkout clearly explains that delivery must be approved before payment.
2. **Given** a customer chooses delivery, **When** they submit required contact, address, date, time, and delivery notes, **Then** the system records a delivery request and does not collect payment.
3. **Given** a delivery request has been submitted, **When** the customer reaches the confirmation screen, **Then** the screen shows the request status, order summary, estimated total if available, and a message that payment will happen only after approval.

---

### User Story 2 - Admin Approves Or Declines Delivery Requests (Priority: P2)

Shayley or an authorized tenant admin can review delivery requests, compare the requested delivery timing against business capacity, approve requests, decline requests, or propose pickup instead.

**Why this priority**: Shayley needs operational control before promising delivery. Approval protects her schedule, event commitments, and customer experience.

**Independent Test**: Can be tested by submitting a delivery request and verifying that an authorized admin can see the request, approve it, decline it, or mark pickup as the alternative without exposing the request to other tenants.

**Acceptance Scenarios**:

1. **Given** a customer submits a delivery request, **When** Shayley views admin orders, **Then** the request appears with customer contact, delivery address, requested timing, order items, estimated total, and current status.
2. **Given** Shayley can deliver the order, **When** she approves the request, **Then** the order becomes ready for customer payment and records who approved it and when.
3. **Given** Shayley cannot deliver the order, **When** she declines delivery, **Then** the order records the decline reason and no payment request is created.
4. **Given** delivery is unavailable but pickup is acceptable, **When** Shayley offers pickup instead, **Then** the order records the proposed fulfillment change and requires customer acceptance before payment.

---

### User Story 3 - Customer Pays Only After Approval (Priority: P3)

After a delivery request is approved, the customer can pay the approved amount and receive confirmation that the order is paid and scheduled for the approved delivery details.

**Why this priority**: The business still needs online payment, but payment should happen only after Shayley has accepted the delivery commitment.

**Independent Test**: Can be tested by approving a submitted delivery request, opening the customer payment path, completing payment, and confirming the order becomes paid with the approved delivery details preserved.

**Acceptance Scenarios**:

1. **Given** a delivery request is approved, **When** the customer opens the payment request, **Then** they see the approved delivery details, item total, delivery fee if any, taxes or processing fees when applicable, and final payable total before payment.
2. **Given** the customer pays an approved delivery order, **When** payment succeeds, **Then** the order is marked paid and the admin view shows it as ready for fulfillment.
3. **Given** an approved delivery request expires or is no longer valid, **When** the customer attempts to pay, **Then** the system prevents payment and asks them to contact Shayley or submit a new request.

### Edge Cases

- A customer starts a pickup checkout path and switches to delivery; the flow must change from immediate payment to approval required before payment.
- A customer starts a delivery request and switches back to pickup before submission; the order may return to the standard pickup payment flow if pickup is available.
- A delivery request is approved but the customer does not pay within the allowed window; the request must expire or remain unpaid without blocking Shayley's schedule indefinitely.
- Menu item prices, availability, taxes, or fees change between request submission and approval; the customer must see the approved final total before paying.
- Shayley approves a delivery request and then discovers she cannot fulfill it before payment; the admin must be able to withdraw approval before payment is collected.
- A customer submits an incomplete or invalid address, date, time, or contact method; the request must not be submitted until required fields are corrected.
- A customer submits multiple similar delivery requests; admins must have enough detail to identify possible duplicates.
- Other tenant admins must not see Shayley's delivery requests, delivery addresses, or customer contact details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The checkout flow MUST support at least two fulfillment choices: pickup and delivery.
- **FR-002**: Pickup orders MAY continue to follow the existing immediate online payment flow when pickup details are valid.
- **FR-003**: Delivery orders MUST be submitted as approval-required delivery requests before payment is collected.
- **FR-004**: The customer-facing delivery flow MUST clearly state that selecting delivery does not guarantee delivery until Shayley approves the request.
- **FR-005**: Customers requesting delivery MUST provide name, contact method, delivery address, requested delivery date, requested delivery time or window, and any delivery instructions before submission.
- **FR-006**: Customers MUST be able to review selected items, quantities, notes, estimated subtotal, and delivery-request status before submitting a delivery request.
- **FR-007**: The system MUST prevent payment collection for delivery orders until an authorized tenant admin approves delivery.
- **FR-008**: Shayley or an authorized tenant admin MUST be able to view pending delivery requests with customer contact, delivery address, requested date/time, order items, notes, estimated totals, and request age.
- **FR-009**: Shayley or an authorized tenant admin MUST be able to approve a delivery request, decline a delivery request, or offer pickup as an alternative.
- **FR-010**: Approval MUST preserve the approved fulfillment method, delivery address, delivery timing, order items, delivery fee if any, and final payable total shown to the customer before payment.
- **FR-011**: Declining delivery MUST allow the admin to record a customer-visible reason or next step.
- **FR-012**: Offering pickup instead of delivery MUST require customer acceptance before payment.
- **FR-013**: Customers MUST have a path to pay only after approval, and that path MUST show the approved delivery details and final payable total before payment.
- **FR-014**: Approved delivery payment requests MUST expire or become invalid after a business-defined time window so old approvals cannot be paid after circumstances change.
- **FR-015**: The system MUST prevent payment if an approved delivery request has been withdrawn, declined, expired, already paid, or materially changed after approval.
- **FR-016**: Admin order views MUST distinguish pending delivery requests, approved unpaid delivery orders, declined delivery requests, paid delivery orders, and pickup orders.
- **FR-017**: Customer and admin status labels MUST use clear business language such as "Delivery Requested", "Delivery Approved - Payment Needed", "Delivery Declined", and "Paid".
- **FR-018**: Delivery requests, addresses, approval decisions, and payment records MUST remain tenant-scoped.
- **FR-019**: The system MUST retain a status history for delivery approval decisions, including who made the decision and when.
- **FR-020**: The feature MUST work on common mobile and desktop screen sizes for both customer checkout and admin review.

### Key Entities

- **Fulfillment Method**: The customer's selected handoff type for an order, such as pickup or delivery.
- **Delivery Request**: An approval-required order state for delivery-selected checkout before payment; includes customer contact, address, requested timing, order items, notes, and current status.
- **Delivery Approval Decision**: The admin decision on a delivery request; includes approved, declined, pickup offered, withdrawn, or expired outcomes with timestamps and optional customer-visible notes.
- **Approved Payment Request**: The payment-ready state created after delivery approval; includes the approved fulfillment details, final payable total, expiration, and payment status.
- **Order Status History**: A timeline of fulfillment and payment status changes used for admin review and auditability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of delivery-selected checkout attempts submit as approval-required requests without collecting payment before approval.
- **SC-002**: At least 90% of test customers understand from the checkout and confirmation screens that delivery is pending approval and payment will happen later.
- **SC-003**: Shayley can find and approve or decline a new delivery request in under 2 minutes from the admin order view during acceptance testing.
- **SC-004**: 100% of approved delivery orders show the same approved delivery details and final payable total to the customer before payment.
- **SC-005**: 0 declined, expired, withdrawn, duplicate-paid, or unapproved delivery requests can be paid during acceptance testing.
- **SC-006**: 100% of paid delivery orders appear in admin with paid status, approved delivery details, customer contact, and order items.

## Assumptions

- Pickup remains the simpler fulfillment option and can continue to use immediate online payment.
- Delivery approval is required because Shayley's availability, event schedule, delivery distance, and delivery capacity are not fully knowable by the website at checkout time.
- Version 1 does not require automated route planning, delivery capacity calendars, mileage calculation, or event-schedule conflict detection; admins make the delivery decision manually.
- Delivery fees may be entered or confirmed during approval, then shown to the customer before payment.
- Customer notification can initially be handled by an on-screen status and a shareable or emailed payment path, depending on the existing notification capabilities available during implementation.
- Approval expiration should exist, but the exact time window can be set during implementation using a conservative business default and changed later if Shayley requests it.
- All order and delivery data belongs to the active tenant and must not be visible to other tenants.
