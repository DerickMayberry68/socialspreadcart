# Feature Specification: Booking Quote Form

**Feature Branch**: `001-booking-quote-form`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "add a public-facing booking form where customers can select a date, event type, and package, then submit a quote request."

## Context

The site already has a basic contact/quote form at `/contact`. That form collects
contact details, a free-text event type, a free-text guest count, and an
unstructured list of service checkboxes. This feature replaces or supersedes
that form with a more guided, structured booking experience — one where the
customer makes deliberate selections before providing their contact details,
improving both the quality of inquiry data received by the owner and the
clarity of the experience for the customer.

## User Scenarios & Testing

### User Story 1 — Complete a Quote Request (Priority: P1)

A prospective customer visits the site and wants to request a quote for their
upcoming event. They work through a guided selection of their event date, event
type, and desired service package before filling in their contact details and
submitting the request.

**Why this priority**: This is the core conversion goal of the site — turning a
visitor into a lead. Without this working end-to-end, nothing else matters.

**Independent Test**: A customer can visit the booking form, make all required
selections, provide contact info, and submit — resulting in a confirmation
message to the customer and a new quote record visible in the admin panel.

**Acceptance Scenarios**:

1. **Given** a visitor is on the booking form, **When** they select a date more
   than 48 hours in advance, choose an event type, select at least one service
   package, enter their name / email / phone, and submit, **Then** they see a
   confirmation message and the owner receives a notification.

2. **Given** a visitor attempts to submit without selecting a date, **When** they
   click submit, **Then** the form highlights the missing field with a clear
   error message and does not submit.

3. **Given** a visitor selects a date in the past or within 48 hours, **When**
   they try to proceed, **Then** the form shows a message explaining minimum
   advance notice and prevents submission for that date.

4. **Given** a visitor selects a date, event type, and package but leaves
   contact fields blank, **When** they attempt to submit, **Then** the form
   highlights all missing required contact fields.

---

### User Story 2 — Receive Booking Confirmation (Priority: P2)

After a successful submission, the customer receives a clear, on-brand
confirmation that their request was received and what to expect next.

**Why this priority**: Reduces "did it go through?" follow-up contacts and sets
expectations, which directly impacts owner workload.

**Independent Test**: Can be verified by submitting a test quote and confirming
the success state renders correctly with the expected messaging.

**Acceptance Scenarios**:

1. **Given** a successful submission, **When** the form response is received,
   **Then** the page replaces the form with a branded thank-you state that
   confirms the submission and states the owner will be in touch.

2. **Given** the thank-you state is shown, **When** the visitor wants to submit
   another request, **Then** there is a clear affordance to start over.

---

### User Story 3 — Admin Receives Structured Quote Data (Priority: P3)

When a quote is submitted via the new form, the quote record stored in the admin
system reflects the structured selections (event type from a list, package
selections) rather than raw free-text, making it easier to triage and respond.

**Why this priority**: Improves the owner's workflow but does not block the
customer-facing feature from being usable.

**Independent Test**: After submitting a test quote, the corresponding record in
the admin Quotes list displays the event type and service selections exactly as
the customer chose them.

**Acceptance Scenarios**:

1. **Given** a quote is submitted with a selected event type and package(s),
   **When** the admin views the quote detail, **Then** the event type and
   services are shown as the structured values the customer selected (not
   free-text transcription errors).

---

### Edge Cases

- What happens when the customer selects a date that has already passed?
- What if the customer submits the form twice in quick succession (double-click)?
- What if the network request fails after the customer submits?
- What if the customer has JavaScript disabled? (Assumption: JS required — see Assumptions)

## Requirements

### Functional Requirements

- **FR-001**: The form MUST present date selection before the customer is asked
  for contact details.
- **FR-002**: The date selector MUST prevent selection of past dates and dates
  fewer than 48 hours from today.
- **FR-003**: The form MUST present event type as a selectable list, not a
  free-text field. Supported types: Wedding, Birthday, Corporate Event, Private
  Party, Anniversary, Baby/Bridal Shower, Holiday Party, Other.
- **FR-004**: The form MUST present the existing individual services as clearly
  labelled, selectable options with brief descriptions. Services: Charcuterie
  Boxes, Charcuterie Cups, Dirty Soda 4-Pack, Charcuterie Cart, Dirty Soda
  Cart, Mini Pancake Bar, Bartending Service, Ice Cream Toppings Bar, Other.
- **FR-005**: The customer MUST select at least one service package before
  submitting.
- **FR-006**: The form MUST collect: full name, email address, phone number,
  and estimated guest count (required); additional message (optional).
- **FR-007**: All required fields MUST be validated before submission. Errors
  MUST be shown inline next to the offending field, not in a generic banner.
- **FR-008**: On successful submission, the form MUST display a branded
  confirmation state and MUST NOT allow the same form data to be re-submitted
  by re-clicking.
- **FR-009**: The submitted quote MUST be saved and visible in the admin Quotes
  panel with the structured event type and service selections.
- **FR-010**: The owner MUST receive an email notification for each new
  submission containing all selected values.
- **FR-011**: A CRM contact record MUST be created or updated for the submitting
  email address, linked to the new quote.

### Key Entities

- **Quote**: Represents a single customer inquiry. Attributes: customer name,
  email, phone, event date, event type (from list), selected service packages
  (one or more), estimated guest count, optional message, submission timestamp,
  status (new / in progress / booked / closed / lost).
- **Contact**: A CRM record for the customer. Created or updated on each new
  quote submission. Linked to all quotes from that email address.
- **Interaction**: A timeline entry on the Contact record noting the quote was
  submitted, what was selected, and when.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A customer with no prior knowledge of the site can complete and
  submit a quote request in under 3 minutes from arriving at the form.
- **SC-002**: 100% of submitted quotes contain a structured event type value
  (no free-text) and at least one service package selection.
- **SC-003**: The form submission error rate due to server-side failures is
  under 1% under normal operating conditions.
- **SC-004**: Every successful submission produces a visible quote record in
  the admin panel within 5 seconds of the customer receiving their confirmation.
- **SC-005**: The owner receives an email notification for every successful
  submission without manual intervention.

## Assumptions

- The booking form lives at the existing `/contact` route (replaces or
  co-exists with the current basic form); the URL does not need to change.
- A minimum of 48 hours advance notice is required for all booking types
  (consistent with current site copy).
- Service options are the existing named services (Charcuterie Boxes,
  Charcuterie Cups, Dirty Soda 4-Pack, Charcuterie Cart, Dirty Soda Cart,
  Mini Pancake Bar, Bartending Service, Ice Cream Toppings Bar, Other)
  presented with clearer labels and brief descriptions. No new package
  bundles or data model changes are required.
- JavaScript is required for the form to function; no progressive-enhancement
  fallback is needed for the v1 scope.
- Mobile visitors are a primary audience; the form MUST be fully usable on
  a phone-sized screen.
- The owner is the sole admin recipient of quote notification emails.
- Guest count is a free-text or numeric field (not a dropdown range) to avoid
  constraining unusual event sizes.
- The form is public-facing and does not require the customer to create an
  account or log in.
