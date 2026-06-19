# Tasks: Admin Event Image Upload

**Input**: Design documents from `specs/024-admin-event-image-upload/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include focused component and upload-route coverage because this affects an admin workflow and file handling.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase.
- **[Story]**: User story mapping from the spec.

## Phase 1: Setup

**Purpose**: Confirm existing upload patterns and target files.

- [x] T001 Inspect existing admin image upload patterns in `src/app/api/admin/menu-items/upload/route.ts` and site-content upload routes
- [x] T002 Inspect current Events editor in `src/components/admin/event-manager.tsx`

---

## Phase 2: Foundational

**Purpose**: Add the event-specific upload route needed by all stories.

- [x] T003 [P] Add focused upload route coverage in `tests/api/admin-events-upload-route.test.ts`
- [x] T004 Add `src/app/api/admin/events/upload/route.ts` with auth, tenant resolution, image validation, tenant-scoped path, storage upload, and public URL response

**Checkpoint**: Event image upload endpoint is available and testable.

---

## Phase 3: User Story 1 - Choose an image while creating an event (Priority: P1)

**Goal**: Admin can create a new event by choosing an image file instead of manually hosting/pasting a URL.

**Independent Test**: Create a new event, choose a valid image, confirm URL and preview populate, then save.

### Tests for User Story 1

- [x] T005 [P] Add EventManager create-form upload behavior coverage in `tests/components/admin/event-manager.test.tsx`

### Implementation for User Story 1

- [x] T006 [US1] Add file input, upload button, upload state, and image URL population to `src/components/admin/event-manager.tsx`
- [x] T007 [US1] Add image preview when `image_url` is populated in `src/components/admin/event-manager.tsx`
- [x] T008 [US1] Disable event save while image upload is active in `src/components/admin/event-manager.tsx`

**Checkpoint**: New event creation with selected image works independently.

---

## Phase 4: User Story 2 - Replace an image while editing an event (Priority: P2)

**Goal**: Admin can replace an existing event image without losing other event field values.

**Independent Test**: Edit an existing event, upload a replacement image, confirm preview and URL update, then save.

### Implementation for User Story 2

- [x] T009 [US2] Ensure edit mode initializes preview/upload state from existing `image_url` in `src/components/admin/event-manager.tsx`
- [x] T010 [US2] Ensure replacement upload changes only `image_url` and preserves title/date/location/description in `src/components/admin/event-manager.tsx`

**Checkpoint**: Editing and replacing event images works independently.

---

## Phase 5: User Story 3 - Handle invalid or failed image uploads (Priority: P3)

**Goal**: Admin receives clear feedback for invalid or failed uploads and the form keeps the previous image URL.

**Independent Test**: Upload a non-image or force an upload failure and confirm handled error behavior.

### Implementation for User Story 3

- [x] T011 [US3] Keep prior `image_url` unchanged when event image upload fails in `src/components/admin/event-manager.tsx`
- [x] T012 [US3] Show handled toast errors for missing file, non-image file, and storage failure paths

**Checkpoint**: Upload failures are handled without corrupting form state.

---

## Phase 6: Polish & Verification

- [x] T013 Run `npx vitest run tests/components/admin/event-manager.test.tsx tests/api/admin-events-upload-route.test.ts`
- [x] T014 Run `npx tsc --noEmit`
- [x] T015 Run `npm run build`
- [ ] T016 Manually verify `/admin/events` image upload flow on the running app when credentials/session are available

---

## Dependencies & Execution Order

- T003 and T004 establish the upload endpoint.
- T006-T008 implement MVP create flow after T004.
- T009-T010 build on the same form behavior for edit mode.
- T011-T012 validate failure behavior after upload handling exists.
- T013-T016 verify the complete feature.

## Implementation Strategy

1. Add endpoint and focused route coverage.
2. Enhance the existing Events form with upload, URL fill, preview, and save disabling.
3. Verify create, edit, and failure flows.
4. Keep manual image URL entry intact throughout.
