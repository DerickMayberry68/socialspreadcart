# Research: Delivery Approval Before Payment

## Decision: Approve delivery before collecting payment

**Rationale**: Shayley cannot safely promise every delivery at checkout time. Availability, event commitments, delivery distance, requested timing, and order volume require human review. Charging first creates refund, support, and trust problems if delivery later cannot be fulfilled.

**Alternatives considered**:

- **Immediate charge for delivery orders**: Rejected because customers could pay before Shayley confirms she can deliver.
- **Stripe authorization with later capture**: Rejected for v1 because it adds authorization expiration, capture timing, partial-change, and customer-service complexity.
- **Deposit before approval**: Rejected because the business problem is availability, not commitment quality.

## Decision: Keep delivery requests in the order domain, not the quote domain

**Rationale**: Delivery requests are still menu-item orders from the Order Tray. The customer is not asking for custom catering scope or a custom proposal; they are asking whether the listed order can be delivered. Keeping the flow in orders preserves item details, totals, payment records, and admin order visibility.

**Alternatives considered**:

- **Convert delivery orders to quotes**: Rejected because it would blur customer language and split order/payment data across a separate workflow.
- **Reuse quote status labels**: Rejected because "quote" is misleading for a customer buying listed items.

## Decision: Use explicit delivery/order statuses

**Rationale**: The current order status set focuses on payment and fulfillment. Delivery approval adds important unpaid states that must be visible to customers and admins. Explicit statuses make filtering, payment eligibility, and support review safer.

**Alternatives considered**:

- **Use `payment_pending` for all unpaid states**: Rejected because a delivery request pending approval is not ready for payment.
- **Store delivery decision only in notes**: Rejected because notes are not enforceable state and cannot reliably block payment.

## Decision: Persist status history

**Rationale**: Admin approval, decline, pickup offer, withdrawal, expiration, and customer payment are operationally important. A history table gives Shayley context when customers call, and it makes future notification or audit work easier.

**Alternatives considered**:

- **Only store current status**: Rejected because it loses who made delivery decisions and when.
- **Use generic interaction notes**: Rejected because order status transitions need structured state for payment eligibility.

## Decision: Manual delivery decisions in v1

**Rationale**: Manual approval directly solves the immediate business risk with less complexity. Automated distance, route, capacity, and event-conflict logic can be added after Shayley validates the workflow with real orders.

**Alternatives considered**:

- **Calendar/capacity automation now**: Deferred because it requires accurate availability data and more product decisions.
- **Mileage-based fee automation now**: Deferred because delivery pricing may need client confirmation first.

## Decision: Expire approved unpaid delivery requests

**Rationale**: Shayley's schedule and availability can change. An approval should not stay payable forever. Expiration protects the business from stale commitments.

**Alternatives considered**:

- **No expiration**: Rejected because customers could pay later after availability changes.
- **Same-day-only approval**: Deferred because the exact business window should be easy to tune after client review.
