# Feature Specification: Admin Event Image Upload

**Feature Branch**: `024-admin-event-image-upload`  
**Created**: 2026-06-19  
**Status**: Draft  
**Input**: User description: "get latest I've made updates since I've worked on this pc then we need to look at adding a new event. The image URL is there but there is now way to select an image."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose an image while creating an event (Priority: P1)

An admin creating a new public event can choose an image from their device, have the event form fill the image URL automatically, preview the chosen image, and save the event without manually copying a hosted URL.

**Why this priority**: The current event form exposes an image URL field but gives the admin no practical way to select or upload an image, blocking non-technical event creation.

**Independent Test**: Can be fully tested by opening the admin Events editor, creating a new event, choosing a valid image file, confirming the preview appears, saving the event, and confirming the saved event has the selected image.

**Acceptance Scenarios**:

1. **Given** an authenticated tenant admin is creating an event, **When** they choose a valid image file, **Then** the form shows an upload progress state and fills the image URL after the upload completes.
2. **Given** an uploaded image URL is present in the event form, **When** the admin saves the event, **Then** the event is saved with that image and appears in the scheduled events list.
3. **Given** an admin has uploaded an image, **When** the upload succeeds, **Then** the admin sees a clear preview of the selected image before saving.

---

### User Story 2 - Replace an image while editing an event (Priority: P2)

An admin editing an existing event can replace the event image using the same chooser/upload flow, without losing existing event title, date, location, or description values.

**Why this priority**: Event images may need to change after an event is created, and editing should be as easy as creation.

**Independent Test**: Can be tested by editing an existing event with an image, choosing a different valid file, confirming the preview changes, saving, and confirming the saved event now references the replacement image.

**Acceptance Scenarios**:

1. **Given** an existing event has an image, **When** the admin uploads a replacement image, **Then** the form updates only the image URL and preview while preserving the other field values.
2. **Given** the replacement image upload succeeds, **When** the admin saves the event, **Then** the event uses the replacement image.

---

### User Story 3 - Handle invalid or failed image uploads (Priority: P3)

An admin receives clear feedback when they choose a non-image file, an oversized file, or when image upload is unavailable, and the form does not silently save a bad image value.

**Why this priority**: Upload failures should not corrupt event content or leave admins unsure whether an event image was saved.

**Independent Test**: Can be tested by attempting to upload unsupported files and by simulating an upload failure, then confirming the admin sees a handled error and the existing image URL remains unchanged.

**Acceptance Scenarios**:

1. **Given** an admin chooses a non-image file, **When** the upload is attempted, **Then** the system rejects it with a clear message and does not update the image URL.
2. **Given** an admin chooses a file that cannot be uploaded, **When** the upload fails, **Then** the system shows a handled error and keeps the previous image URL unchanged.

---

### User Story 4 - Show event images publicly (Priority: P2)

Visitors viewing upcoming events on the home page or Events page can see the uploaded event image alongside the event date, title, location, and description.

**Why this priority**: Uploading an event image has limited value if the public event cards do not display it where visitors browse upcoming appearances.

**Independent Test**: Can be tested by creating an event with an uploaded image, then viewing the home page upcoming events section and the Events calendar page to confirm the image and date both appear.

**Acceptance Scenarios**:

1. **Given** an event has an image URL, **When** a visitor views the home page upcoming events section, **Then** the event card shows the image and still shows the event date.
2. **Given** an event has an image URL, **When** a visitor views the Events page calendar/list, **Then** the event card shows the image and still shows the event date.
3. **Given** an event has no image URL, **When** the event appears publicly, **Then** the card still shows a polished date-first layout without a broken image.

### Edge Cases

- An event can still be saved without an image, because the current event image URL is optional.
- If an admin manually pastes a valid image URL, the form should continue to support that workflow.
- If the admin chooses a new image after a previous upload, the most recent successful upload should populate the image URL.
- If upload fails after the admin already has an image URL in the form, the existing URL must remain intact.
- If the admin cancels the form after uploading but before saving, no event record should be created or updated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Events admin form MUST provide a visible image chooser/upload control near the existing image URL field.
- **FR-002**: The system MUST support image upload while creating a new event and while editing an existing event.
- **FR-003**: The system MUST automatically populate the event image URL after a successful image upload.
- **FR-004**: The system MUST show a preview when the event form has an image URL.
- **FR-005**: The system MUST preserve manual image URL entry for admins who already have a hosted image URL.
- **FR-006**: The system MUST reject non-image files with a handled error message.
- **FR-007**: The system MUST show a clear uploading state while an event image upload is in progress.
- **FR-008**: The system MUST prevent saving while an image upload is actively in progress.
- **FR-009**: The system MUST keep event image uploads tenant-scoped so one tenant's event assets are not mixed with another tenant's assets.
- **FR-010**: The system MUST not use browser alert, confirm, or prompt dialogs for upload errors or confirmations.
- **FR-011**: The system MUST return the uploaded image URL in a way the Events form can use immediately.
- **FR-012**: The system MUST leave the existing image URL unchanged when an attempted upload fails.
- **FR-013**: Public home page event cards MUST display the event image when an image URL exists while preserving the event date display.
- **FR-014**: Public Events page event cards MUST display the event image when an image URL exists while preserving the event date display.
- **FR-015**: Public event cards MUST avoid rendering broken image elements when an event has no image URL.

### Key Entities *(include if feature involves data)*

- **Event**: A public calendar appearance with title, date/time, location, description, and an optional image URL.
- **Event Image**: An uploaded image asset associated with a tenant and intended for use by an event record.
- **Tenant Admin**: An authenticated admin user managing the current tenant's event content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can create an event with a selected image in under 2 minutes without manually copying or hosting an image URL.
- **SC-002**: 100% of valid image uploads populate the image URL field and show a preview before save.
- **SC-003**: 100% of unsupported file uploads show a handled error and leave the current image URL unchanged.
- **SC-004**: Existing manual image URL entry remains usable for event creation and editing.
- **SC-005**: Event image upload works consistently for both new and existing events in the admin Events editor.
- **SC-006**: 100% of public event cards with an image URL display both the uploaded image and event date on the home page and Events page.

## Assumptions

- Event images are optional, matching the current event form behavior.
- Existing tenant admin authentication and tenant resolution are reused.
- Existing site storage conventions for tenant-scoped public images are reused.
- The image chooser uploads a new image from the admin's device; browsing a full media library is out of scope for this feature.
