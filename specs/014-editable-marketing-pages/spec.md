# Feature Specification: Editable Marketing Pages

**Feature Branch**: `014-editable-marketing-pages`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Shayley needs to edit all copy content and images for each main public marketing page. Forms are OK for now."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Shared Site Shell Content (Priority: P1)

As a client admin, Shayley can edit shared visitor-facing content that appears across the public site, including navigation labels, header strip copy, footer CTA/story copy, contact details, and social links, so shared public content stays accurate without developer help.

**Why this priority**: The shared shell appears on every marketing page and currently mixes editable CTA/support fields with static copy and contact details.

**Independent Test**: Sign in as a tenant admin, update shell copy/contact/social fields, save, and confirm the public header/footer/navigation reflect the saved values across the public marketing pages.

**Acceptance Scenarios**:

1. **Given** a tenant admin is editing shared site content, **When** they update navigation labels, header strip copy, footer copy, location, phone, email, and social link values and save, **Then** every public marketing page renders the saved shared content.
2. **Given** required shell content is missing or invalid, **When** the admin saves, **Then** the system prevents publication and identifies the invalid fields.
3. **Given** no saved shell content exists, **When** a visitor views the site, **Then** the site renders polished fallback shell content without broken links or images.

---

### User Story 2 - Edit Remaining Home Page Copy And Images (Priority: P2)

As a client admin, Shayley can edit all remaining Home page copy and images not already covered by the hero and pathway card editors, so the full landing page can be refreshed without code changes.

**Why this priority**: The Home page is the highest-value public page and still contains many hardcoded sections.

**Independent Test**: Change at least one field in each Home page section editor, save, and confirm the public Home page reflects all saved changes while existing hero/pathway editors continue working.

**Acceptance Scenarios**:

1. **Given** the admin edits Home proof stats, pillar cards, section headings, story/service copy, booking steps, CTA copy, and image fields, **When** they save, **Then** the public Home page renders the saved content.
2. **Given** existing hero and pathway cards have saved content, **When** remaining Home page content is saved, **Then** hero and pathway content remain unchanged.
3. **Given** image fields are empty or invalid, **When** the admin saves, **Then** invalid image content is rejected or safe fallbacks prevent broken public images.

---

### User Story 3 - Edit Page-Level Copy And Images For Menu, Events, Cart Service, And Contact (Priority: P3)

As a client admin, Shayley can edit page-level copy and image content for Menu, Events, Cart Service, and Contact while existing menu item, event, quote, and contact management remains intact.

**Why this priority**: These pages already have operational data flows, but the page-level marketing copy and some images are still static.

**Independent Test**: For each page, update the page heading/support cards or image fields, save, and confirm the matching public page renders saved content without changing menu products, events, or submitted leads.

**Acceptance Scenarios**:

1. **Given** the admin edits Menu page copy and support cards, **When** they save, **Then** the public Menu page renders the saved page content and still displays saved menu items.
2. **Given** the admin edits Events page copy and explanatory cards, **When** they save, **Then** the public Events page renders the saved page content and still displays saved events.
3. **Given** the admin edits Cart Service copy, included items, service chips, CTAs, and images, **When** they save, **Then** the public Cart Service page renders the saved content.
4. **Given** the admin edits Contact page copy, planning card, expectation text, and contact detail labels, **When** they save, **Then** the public Contact page renders the saved content and the quote form still submits successfully.

---

### User Story 4 - Complete Existing Gallery And About Coverage (Priority: P4)

As a client admin, Shayley can rely on the existing Gallery and About editors to cover all visible copy and image fields on those pages, so no public page sections remain developer-only.

**Why this priority**: Gallery and About already have editors; this pass should close any remaining gaps rather than rebuild working flows.

**Independent Test**: Audit Gallery and About public pages against their admin forms, update every visible editable field, and confirm no visitor-facing copy or image remains hardcoded except fixed layout labels that are intentionally non-content.

**Acceptance Scenarios**:

1. **Given** the admin opens the Gallery editor, **When** they compare it to the public Gallery page, **Then** every visible page copy field and gallery image can be changed from the admin.
2. **Given** the admin opens the About editor, **When** they compare it to the public About page, **Then** every visible page copy field and image can be changed from the admin.

### Edge Cases

- If saved content is partial or unavailable, public pages must render complete fallback content without broken images or missing required copy.
- If a tenant admin enters invalid URLs, overly long text, missing required copy, or missing image alt text, the save must fail with clear guidance and no partial invalid publication.
- If two admins save near the same time, the editor should reload or display the latest saved state after save.
- If a signed-in user is not an admin for the current tenant, they must not read or modify another tenant's marketing page content.
- If existing menu items, events, quotes, gallery content, or about content already exists, adding page-level content must not overwrite it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide admin forms for editing all copy content and images on the main public marketing pages: Home, Menu, Cart Service, Events, Gallery, About, Contact, plus shared header/footer/navigation content.
- **FR-002**: The system MUST preserve existing admin editors for hero, pathway cards, gallery, about, menu items, events, quotes, and contacts where those workflows already exist.
- **FR-003**: The system MUST allow tenant admins to edit page-level copy, lists, CTA labels/targets, support card content, contact details, social links, and image URLs or uploaded image references for the covered pages.
- **FR-004**: Every visitor-facing image controlled by this feature MUST include editable descriptive text for accessibility.
- **FR-005**: Saved content MUST publish immediately to the public site without a developer deploy.
- **FR-006**: Content MUST be tenant-scoped so admins can only read and write content for the current client site.
- **FR-007**: Public pages MUST render safe fallback content when saved tenant content is missing, incomplete, or temporarily unavailable.
- **FR-008**: The system MUST validate required fields, URL fields, bounded copy lengths, repeatable list lengths, and image descriptive text before saving.
- **FR-009**: Failed saves MUST preserve the last published content and show handled errors without stack traces.
- **FR-010**: Successful saves MUST show non-blocking success notifications.
- **FR-011**: Shared shell content updates MUST apply consistently across all covered public pages.
- **FR-012**: Page-level content updates MUST NOT overwrite operational records such as menu items, events, submitted quotes, or contacts.

### Key Entities *(include if feature involves data)*

- **Marketing Page Content**: Tenant-scoped saved content for one public page or shared shell area, including a page key, structured content fields, timestamps, and editor metadata.
- **Page Section**: A structured group of copy, links, lists, or images displayed in a known public page layout.
- **Editable Image**: A visitor-facing image reference with descriptive text, optional storage path, display label, and position within a page section.
- **Client Site**: The tenant-owned public site whose admins can edit only their own content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A tenant admin can update shared header/footer/navigation content in under 5 minutes without developer help.
- **SC-002**: A tenant admin can update at least one copy or image field on each covered public marketing page in under 15 minutes total.
- **SC-003**: 100% of valid saved content changes are visible on the matching public page after publication.
- **SC-004**: 100% of tested invalid saves preserve the previous public content and show a handled error.
- **SC-005**: Public pages render without broken image placeholders in saved, fallback, and partial-content states.
- **SC-006**: Tenant admins cannot access or modify another tenant's marketing page content in any tested admin workflow.

## Assumptions

- The covered scope is the main public marketing website only, not auth, invite, tenant-selection, admin, coming-soon, or design-lab routes.
- Form-based editors are acceptable for this release.
- Existing menu item, event, quote, gallery, about, hero, and pathway card workflows remain separate where already implemented.
- Saves publish immediately; draft scheduling, page previews, rich text, drag-and-drop page building, cropping, focal points, and version history are out of scope.
