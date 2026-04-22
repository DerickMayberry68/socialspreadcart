# Feature Specification: Admin About Content

**Feature Branch**: `013-admin-about-content`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "Add the ability in Admin Site Content for the client to edit the About page copy, feature cards, and About page images while handled exceptions show in modal alerts and success notifications remain toasts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit About Page Copy (Priority: P1)

As a client admin, Shayley can edit the visitor-facing About page story, heading, and supporting copy from Admin Site Content so the brand narrative can change without developer help.

**Why this priority**: The About page is primarily a brand story page. Editable copy delivers the core client value even before image or card management is added.

**Independent Test**: Can be fully tested by signing in as a client admin, changing the About page heading and story copy, saving, and confirming the public About page displays the saved words.

**Acceptance Scenarios**:

1. **Given** a client admin is viewing the About content editor, **When** they update the page heading, intro description, story badge, story headline, and body paragraphs and save, **Then** the saved copy appears in the admin editor and on the public About page.
2. **Given** a client admin leaves required About copy blank or enters copy beyond allowed limits, **When** they try to save, **Then** the system prevents publication and shows clear guidance in a modal alert.
3. **Given** the save request fails, **When** the client admin attempts to publish About copy changes, **Then** the previously published About page content remains unchanged and the handled error appears in a modal alert without a stack trace.

---

### User Story 2 - Manage About Page Images (Priority: P2)

As a client admin, Shayley can change the images displayed on the public About page so the page can show current product, cart, service, or brand photography.

**Why this priority**: The About page currently includes a prominent image grid, and the client specifically wants control over photos and images throughout site content.

**Independent Test**: Can be tested by uploading or replacing an About page image, saving, and confirming the public About page shows the new image while preserving required descriptive text.

**Acceptance Scenarios**:

1. **Given** an About image slot exists, **When** the client admin uploads or enters a valid image and descriptive text and saves, **Then** that image appears in the corresponding public About page image slot.
2. **Given** an existing About image exists, **When** the client admin replaces it and saves, **Then** the public About page uses the replacement image without breaking the page layout.
3. **Given** an image upload is cancelled, invalid, or fails, **When** the client admin returns to the editor, **Then** the previous image remains available and the failure is shown in a modal alert.

---

### User Story 3 - Edit About Feature Cards (Priority: P3)

As a client admin, Shayley can edit the three About page feature cards so the page can highlight the values, service qualities, or location details that matter most for the brand right now.

**Why this priority**: Feature card editing completes the About page content surface, but the page still provides useful editable value with copy and image editing alone.

**Independent Test**: Can be tested by changing all three feature card titles and body copy, saving, and confirming the public About page displays the new cards in the same visual positions.

**Acceptance Scenarios**:

1. **Given** the About page has three feature cards, **When** the client admin edits each card title and body copy and saves, **Then** the public About page displays the saved card content.
2. **Given** a client admin enters invalid or missing card content, **When** they attempt to save, **Then** the invalid card is identified and no partial invalid update is published.
3. **Given** the editor save succeeds, **When** the admin receives confirmation, **Then** the success notification appears as a toast rather than a modal.

### Edge Cases

- If no saved About content exists for a client site, the public About page must continue showing polished fallback content.
- If the About image list is incomplete, the public page must use safe fallbacks or omit missing image slots without showing broken images.
- If a client admin uploads an invalid image type or storage is unavailable, the previous image must remain unchanged and the handled error must appear in a modal alert.
- If copy is unusually long, the public About page must remain readable and avoid overlapping content on mobile and desktop.
- If a signed-in user does not administer the current client site, they must not be able to view or change that client's About content.
- If two client admins save About content near the same time, the latest saved state must be clear in the editor after save.
- Handled failures must not display framework call stacks, raw exception traces, or browser error overlays to client admins.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an Admin Site Content area for managing public About page content.
- **FR-002**: Client admins MUST be able to edit the About page section eyebrow, title, and intro description.
- **FR-003**: Client admins MUST be able to edit the main story card badge, headline, and body paragraphs.
- **FR-004**: Client admins MUST be able to edit exactly three About feature cards, each with a title and body copy.
- **FR-005**: Client admins MUST be able to replace or enter About page images used by the public About page.
- **FR-006**: Each public About image MUST include descriptive text for accessibility.
- **FR-007**: The system MUST validate required About copy, card text, image URLs, and image descriptive text before publishing changes.
- **FR-008**: The system MUST show a clear preview or representation of saved About content in the admin editor.
- **FR-009**: Saved About content MUST appear on the public About page without developer intervention.
- **FR-010**: About content MUST remain scoped to the current client site and must not expose or alter another client's About content.
- **FR-011**: The system MUST preserve previously published About content when a save or upload attempt fails.
- **FR-012**: Handled errors in the About editor MUST be shown in a modal alert and MUST NOT expose stack traces or raw call stacks.
- **FR-013**: Successful About content updates and successful image uploads MUST be shown as non-blocking notification toasts.
- **FR-014**: The public About page MUST preserve the existing polished layout and brand presentation while rendering saved client content.
- **FR-015**: The system MUST provide safe fallback About copy, cards, and images when saved tenant content is missing or unavailable.

### Key Entities *(include if feature involves data)*

- **About Page Content**: The tenant-scoped visitor-facing copy that frames the public About page, including section heading, intro text, story card badge, story headline, and story body paragraphs.
- **About Image**: A tenant-scoped image displayed on the public About page, including its media reference, descriptive text, display order or slot, and active state.
- **About Feature Card**: A tenant-scoped card displayed on the public About page, including title, body copy, icon identity from the existing visual set, and display order.
- **Client Site**: The tenant-owned public site whose admin users can manage only their own About content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A client admin can update the About page heading and story copy in under 3 minutes without developer assistance.
- **SC-002**: A client admin can replace an About page image and required descriptive text in under 3 minutes.
- **SC-003**: A client admin can update all three About feature cards in under 4 minutes.
- **SC-004**: 100% of valid saved About copy, image, and feature card changes are visible on the public About page after publication.
- **SC-005**: 100% of tested invalid save and upload failures preserve the last published About content and show a modal alert without a stack trace.
- **SC-006**: Public About pages render without broken image placeholders in 100% of tested saved, fallback, and partial-content states.
- **SC-007**: Client admins cannot access or modify About content for another client site in any tested admin workflow.

## Assumptions

- The About page editor is part of the existing Admin Site Content workflow rather than a separate CMS product.
- Saves publish immediately, matching existing Site Configuration, Hero, Pathway Cards, and Gallery content behavior.
- The first release supports copy, three feature cards, and About page images; advanced image cropping, image focal points, video, and draft scheduling are out of scope.
- Existing admin authentication and client-site permissions apply to this feature.
- The current About page's visual structure remains the target public layout unless the client later requests a redesign.
