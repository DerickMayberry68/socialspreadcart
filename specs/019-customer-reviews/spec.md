# Feature Specification: Customer Reviews And Floating CTA

**Feature Branch**: `019-customer-reviews`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "Spec out adding a reviews section so customers can add reviews. Remove the Contact menu option and add a floating button above the Book The Cart floating button."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Submits A Review (Priority: P1)

As a recent customer or event guest, I can open a clear review entry point, submit my name, rating, review text, and optional event context, and receive confirmation that the review was received.

**Why this priority**: The feature's core value is collecting authentic customer feedback without requiring the business owner to manually copy reviews from other channels.

**Independent Test**: A visitor can use the new floating review button, complete the review form, submit it, and see a confirmation without needing admin access.

**Acceptance Scenarios**:

1. **Given** a visitor is on any public marketing page, **When** they select the new review floating button, **Then** they can access a review submission experience without losing the current page context.
2. **Given** a visitor enters valid review details, **When** they submit the review, **Then** the system accepts the review and shows a clear confirmation that it will be reviewed before publication.
3. **Given** required review details are missing or invalid, **When** the visitor submits the form, **Then** the system prevents submission and identifies the fields that need attention.

---

### User Story 2 - Visitors Read Approved Reviews (Priority: P2)

As a prospective customer, I can browse approved customer reviews in a polished reviews section so I can see social proof before booking or ordering.

**Why this priority**: Reviews help visitors trust the business and support booking decisions, but public display depends on having a reliable submission and moderation flow.

**Independent Test**: With at least one approved review available, a visitor can view the public reviews section and see customer name, rating, review text, and relevant event context.

**Acceptance Scenarios**:

1. **Given** approved reviews exist, **When** a visitor views the reviews section, **Then** approved reviews are displayed in a visually consistent card layout.
2. **Given** no reviews have been approved yet, **When** a visitor views the reviews section, **Then** the page shows a polished empty state or hides the section without leaving blank space.
3. **Given** a review has not been approved, **When** a visitor views the public site, **Then** that review is not displayed.

---

### User Story 3 - Admin Reviews And Publishes Submissions (Priority: P3)

As a tenant admin, I can review submitted customer reviews, approve the ones that should appear publicly, reject inappropriate submissions, and keep the public section trustworthy.

**Why this priority**: Public review submission needs moderation to avoid spam, private information, and off-brand content.

**Independent Test**: A tenant admin can open a reviews management area, approve a pending review, and confirm the approved review appears publicly while rejected reviews remain hidden.

**Acceptance Scenarios**:

1. **Given** a new review has been submitted, **When** a tenant admin views review submissions, **Then** the review appears with enough detail to approve or reject it.
2. **Given** a tenant admin approves a review, **When** the public reviews section refreshes, **Then** the approved review appears publicly.
3. **Given** a tenant admin rejects or hides a review, **When** the public reviews section refreshes, **Then** the review does not appear publicly.

---

### User Story 4 - Simplify Public Navigation And Floating Actions (Priority: P4)

As a visitor, I see simplified top navigation without a Contact menu option, plus floating actions for leaving a review and booking the cart, so the highest-value actions stay visible without crowding the main navigation.

**Why this priority**: This supports the user's requested navigation change and makes review submission discoverable across the site.

**Independent Test**: A visitor can view the public header and floating action area on desktop and mobile, confirm the Contact navigation item is removed, and use both floating buttons.

**Acceptance Scenarios**:

1. **Given** a visitor views the public site header, **When** the navigation renders, **Then** the Contact menu option is absent.
2. **Given** a visitor views a public marketing page, **When** floating actions render, **Then** a review button appears above the existing Book The Cart button.
3. **Given** the Contact menu option is removed, **When** visitors need to book or contact the business, **Then** booking and contact pathways remain available through CTAs, footer contact details, and relevant page links.

### Edge Cases

- If a submitted review includes spam, profanity, or private information, it must remain unpublished until an admin chooses an appropriate action.
- If a visitor submits the same review more than once, the system should avoid creating confusing duplicate public entries.
- If review submission temporarily fails, the visitor must receive a handled error and their entered text should not be silently lost.
- If an approved review is later hidden or rejected, it must stop appearing on public pages.
- If the reviews section has many approved reviews, visitors should still be able to scan the section without an excessively long page.
- If JavaScript or enhanced interactions fail, the existing Book The Cart pathway must remain accessible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a public review submission entry point from a floating button shown above the existing Book The Cart floating button.
- **FR-002**: The review floating button MUST be visible and usable on public marketing pages on desktop and mobile without overlapping existing navigation, footer content, or the Book The Cart button.
- **FR-003**: Visitors MUST be able to submit a review with, at minimum, display name, rating, review text, and optional event or service context.
- **FR-004**: Review submissions MUST validate required fields, rating range, copy length, and basic contact/spam safety before accepting the submission.
- **FR-005**: Newly submitted reviews MUST default to a non-public pending state.
- **FR-006**: The public site MUST display only approved reviews.
- **FR-007**: The public reviews section MUST match the current visual language of the site and support a polished empty state when no approved reviews exist.
- **FR-008**: Tenant admins MUST be able to view pending, approved, rejected, and hidden reviews for their tenant.
- **FR-009**: Tenant admins MUST be able to approve, reject, hide, or restore reviews without developer help.
- **FR-010**: Review records MUST be tenant-scoped so one tenant cannot view, approve, edit, or publish another tenant's reviews.
- **FR-011**: The Contact option MUST be removed from the public header navigation.
- **FR-012**: Removing Contact from header navigation MUST NOT remove the Contact page, quote form, footer contact details, or booking CTAs.
- **FR-013**: The system MUST preserve the existing Book The Cart floating button and place the new review action above it in a visually consistent stacked layout.
- **FR-014**: Review submission, success, validation, and error states MUST use the site's handled UI patterns rather than browser alerts or prompts.
- **FR-015**: Public review display MUST avoid exposing customer email, phone number, or other private details.

### Key Entities *(include if feature involves data)*

- **Customer Review**: A tenant-scoped review submitted by a visitor, including display name, rating, review text, optional service/event context, status, submission timestamp, and publication metadata.
- **Review Status**: The moderation state for a review, such as pending, approved, rejected, or hidden.
- **Review Submission Entry Point**: The visitor-facing floating action that opens or links to the review submission experience.
- **Public Reviews Section**: The visitor-facing display area that shows approved reviews and encourages additional reviews.
- **Public Navigation**: The tenant-scoped set of header navigation links shown on marketing pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can submit a valid review in under 2 minutes from any public marketing page.
- **SC-002**: 100% of newly submitted reviews remain hidden from the public site until explicitly approved.
- **SC-003**: A tenant admin can approve or reject a pending review in under 1 minute.
- **SC-004**: Approved reviews appear publicly within one page refresh after approval.
- **SC-005**: The Contact header navigation option is absent on 100% of public marketing pages while booking/contact pathways remain accessible.
- **SC-006**: The stacked floating buttons remain visible and non-overlapping across common mobile and desktop viewport sizes.
- **SC-007**: No tested public review display exposes visitor email, phone number, or admin-only moderation information.

## Assumptions

- Review submissions are moderated before publication by default.
- The review entry point is a floating button labeled in plain customer-facing language such as "Leave a Review" unless changed during planning.
- The Contact page and quote form remain available; only the top navigation Contact menu item is removed.
- The public reviews section is part of the public marketing surface, with the exact page placement to be finalized during planning.
- Tenant admins are the only users who can moderate reviews.
- Rich review media, star-provider imports, third-party review integrations, coupons, and automated review solicitation emails are out of scope for the first release.
