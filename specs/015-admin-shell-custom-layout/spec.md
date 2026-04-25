# Feature Specification: admin-shell-custom-layout

**Feature Branch**: `[015-admin-shell-custom-layout]`  
**Created**: 2026-04-24
**Status**: Ready for Planning

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Navigates Shared Site Content Easily (Priority: P1)

As an admin client editing the shared site content, I want the fields to be logically grouped by the components of the site (Header, Navigation, Call to Action, Footer, and Contact Info) so that I can easily find and change what I need without scrolling through a long list of flat fields.

**Why this priority**: The client needs to manage their own site content without being overwhelmed. A flat list is hard to navigate, leading to poor user experience.

**Independent Test**: Can be fully tested by opening the `/admin/site-content/shell` page and viewing the layout to confirm the fields are grouped into separate UI sections rather than one single continuous form list.

**Acceptance Scenarios**:

1. **Given** an admin enters the `/admin/site-content/shell` page, **When** they view the form, **Then** they see multiple distinct panels or cards grouping the settings (e.g. "Header Settings", "Navigation Menu").
2. **Given** the new layout is in place, **When** the admin updates a grouped field and clicks "Save content", **Then** the save succeeds using the existing data structure transparently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present the `ShellMarketingContent` object editable fields grouped visually into the following sections:
  - **Header Settings** (`header_top_left`, `header_top_right`)
  - **Navigation Menu** (`navigation`)
  - **Booking Call-to-Action** (`booking_cta_label`, `booking_cta_target`)
  - **Footer Copy** (`footer_cta_eyebrow`, `footer_cta_title`, `footer_description`)
  - **Contact & Social** (`location`, `phone`, `email`, `instagram_label`, `instagram_url`)
- **FR-002**: System MUST retain the existing database `marketing_page_content` schema for the `shell` key, mutating only the UI component rendering. No database migrations will be performed.  
- **FR-003**: System MUST provide the same existing validation and form handling functionality, including success/error alerts from the API.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin views structured visual groups (Header, Navigation, etc) without requiring new data migration records.
- **SC-002**: Form fields successfully send a merged JSON payload conforming to the existing type definition, storing the exact previous flat object pattern.

## Assumptions

- We will either wrap the existing un-opinionated form rendering with a component wrapper, or override the `<FieldEditor>` logic to render specific fields in grouped sections.
