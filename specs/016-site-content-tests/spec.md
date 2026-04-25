# Feature Specification: Site Content Vitest

**Feature Branch**: `[016-site-content-tests]`  
**Created**: 2026-04-25
**Status**: Ready for Planning

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Assured of Site Stability (Priority: P1)

As a maintainer of the platform, I want Vitest UI testing around all the site content forms so that I can confidently roll out updates to the editable controls without worrying about silently breaking the client experience.

**Why this priority**: Testing ensures stability. Since clients use the site content managers to edit their digital presence, preventing bugs in this area is paramount.

**Independent Test**: Can be fully tested by running `npm run test` and verifying that all UI control tests pass without actually hitting the real Postgres/API environment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST integrate `jsdom` and `@testing-library/react` into the existing `vitest` configuration.
- **FR-002**: System MUST have a foundational test suite for `PageContentForm` assessing input rendering and API submission mocking.
- **FR-003**: System MUST cover the custom component forms (`HeroForm`, `SiteConfigurationForm`, `AboutManager`, `GalleryManager`, `PathwayCardsManager`) validating their baseline rendering and specific interactions.
- **FR-004**: System MUST mock window history, `fetch`, and next/navigation in the test setup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `npm test` successfully executes the UI test suites.
- **SC-002**: At least 6 test files are functioning properly mirroring the 6 primary Admin site-content editors.

## Assumptions

- We will mock Supabase, `fetch`, and the router because these are unit tests for UI form behavior, not end-to-end integration tests.
