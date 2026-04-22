# Tasks: Admin Gallery Content

**Input**: Design documents from `specs/001-admin-gallery-content/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: No dedicated automated tests were requested in the specification. Include existing `npm test` and `npm run lint` verification in the final phase.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: User story label for story-phase tasks only.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the schema and shared types required by all gallery editing stories.

- [X] T001 Create Supabase migration for `gallery_section_content` and `gallery_images` tables, indexes, RLS policies, and tenant default backfill in `supabase/migrations/20260424_admin_gallery_content.sql`
- [X] T002 [P] Add default gallery section copy constants derived from the current public gallery page in `src/lib/fallback-data.ts`
- [X] T003 [P] Extend gallery public/default type definitions with section copy and image accessibility fields in `src/lib/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared service, validation, and route foundations that every user story depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Extend `GallerySectionContent`, `GalleryImage`, and `GalleryPageContent` domain types in `src/lib/types/site-content.ts`
- [X] T005 Add gallery section and gallery image Zod validation schemas plus exported patch types in `src/lib/validation/site-content.ts`
- [X] T006 Extend `SiteContentService` with `getGallerySectionContent`, `getGalleryImages`, `loadGalleryPageContent`, fallback helpers, and `updateGalleryContent` scaffolding in `src/services/site-content-service.ts`
- [X] T007 Create admin gallery GET/PATCH route shell with `requireTenantAdmin()` guard in `src/app/api/admin/site-content/gallery/route.ts`
- [X] T008 Create admin gallery upload route shell with `requireTenantAdmin()` guard and `boards` bucket gallery prefix in `src/app/api/admin/site-content/gallery/upload/route.ts`
- [X] T009 Add Gallery navigation card to the Admin Site Content index in `src/app/admin/(shell)/site-content/page.tsx`
- [X] T010 Create server page shell that loads gallery content for the editor in `src/app/admin/(shell)/site-content/gallery/page.tsx`
- [X] T011 Create client gallery manager component shell with initial props and save/upload placeholders in `src/components/admin/site-content/gallery-manager.tsx`

**Checkpoint**: Foundation ready. Gallery service contracts, admin route boundaries, and admin page entry point exist.

---

## Phase 3: User Story 1 - Manage Gallery Images (Priority: P1) MVP

**Goal**: Client admins can add, edit, replace, and remove gallery images, then confirm the public gallery reflects saved changes.

**Independent Test**: Sign in as a client admin, add a valid image with required details, edit its details or replace the image, remove it, save after each action, and confirm the admin preview plus `/gallery` reflect the saved state.

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement gallery image DB read mapping and fallback image conversion from `fallbackGallery` in `src/services/site-content-service.ts`
- [X] T013 [US1] Implement gallery image reconciliation for add/edit/remove in `SiteContentService.updateGalleryContent` in `src/services/site-content-service.ts`
- [X] T014 [US1] Complete PATCH handling for image add/edit/remove payloads and validation errors in `src/app/api/admin/site-content/gallery/route.ts`
- [X] T015 [US1] Complete image upload handling, image MIME validation, public URL response, and storage error responses in `src/app/api/admin/site-content/gallery/upload/route.ts`
- [X] T016 [US1] Implement gallery image list editor state, add image action, edit image fields, remove confirmation, and replace-image upload action in `src/components/admin/site-content/gallery-manager.tsx`
- [X] T017 [US1] Render field-level validation messages and `sonner` success/error feedback for image save and upload actions in `src/components/admin/site-content/gallery-manager.tsx`
- [X] T018 [US1] Refactor public gallery page to load `SiteContentService.loadGalleryPageContent` and render saved gallery images in `src/app/(site)/gallery/page.tsx`
- [X] T019 [US1] Handle zero-image and failed-read states without broken placeholders in `src/app/(site)/gallery/page.tsx`
- [X] T020 [US1] Remove or adapt the fallback-only `getGalleryItems` flow so gallery reads no longer bypass `SiteContentService` in `src/lib/data.ts`

**Checkpoint**: User Story 1 is independently functional as the MVP image-management flow.

---

## Phase 4: User Story 2 - Edit Gallery Copy (Priority: P2)

**Goal**: Client admins can edit the gallery heading and supporting copy around the image collection.

**Independent Test**: Sign in as a client admin, update the gallery title, description, feature-card copy, and support-card body, save, and confirm `/gallery` displays the updated copy while existing gallery images remain unchanged.

### Implementation for User Story 2

- [X] T021 [P] [US2] Implement gallery section DB read mapping and default section fallback in `src/services/site-content-service.ts`
- [X] T022 [US2] Implement gallery section upsert inside `SiteContentService.updateGalleryContent` while preserving submitted image state in `src/services/site-content-service.ts`
- [X] T023 [US2] Complete GET response for section copy and images in `src/app/api/admin/site-content/gallery/route.ts`
- [X] T024 [US2] Add gallery section copy fields, character guidance, and validation display to `src/components/admin/site-content/gallery-manager.tsx`
- [X] T025 [US2] Render saved section eyebrow, title, description, feature-card title, and support-card body on the public gallery page in `src/app/(site)/gallery/page.tsx`
- [X] T026 [US2] Preserve the existing public gallery copy as defaults when no saved gallery section row exists in `src/lib/fallback-data.ts`

**Checkpoint**: User Story 2 works independently with existing images unchanged by copy-only saves.

---

## Phase 5: User Story 3 - Control Gallery Presentation Order (Priority: P3)

**Goal**: Client admins can choose the display order of gallery images.

**Independent Test**: Sign in as a client admin, reorder multiple gallery images, save, and confirm `/gallery` displays the images in the saved order. Add a new image without manual reorder and confirm it receives a predictable default position.

### Implementation for User Story 3

- [X] T027 [P] [US3] Normalize `display_order` for submitted gallery images before persistence in `src/services/site-content-service.ts`
- [X] T028 [US3] Persist reordered gallery images without changing their titles, alt text, or image URLs in `src/services/site-content-service.ts`
- [X] T029 [US3] Add move up/down or equivalent reorder controls to each image row in `src/components/admin/site-content/gallery-manager.tsx`
- [X] T030 [US3] Ensure newly added images default to the last display position in `src/components/admin/site-content/gallery-manager.tsx`
- [X] T031 [US3] Ensure the public gallery renders images sorted by saved `display_order` in `src/app/(site)/gallery/page.tsx`

**Checkpoint**: User Story 3 is independently functional and ordering does not regress image add/edit/remove.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate tenant isolation, UX quality, and existing project health after all desired user stories are complete.

- [X] T032 [P] Update quickstart verification notes with any implementation-specific admin route or migration details in `specs/001-admin-gallery-content/quickstart.md`
- [ ] T033 Verify tenant isolation manually for gallery GET, PATCH, upload, and public rendering using the steps in `specs/001-admin-gallery-content/quickstart.md`
- [ ] T034 Verify invalid image upload, missing alt text, overlong copy, save failure, and zero-image gallery behavior using `specs/001-admin-gallery-content/quickstart.md`
- [X] T035 Run `npm test` and fix any regressions in affected files under `src/` and `tests/`
- [X] T036 Run `npm run lint` and fix lint issues in affected files under `src/`
- [ ] T037 Review public gallery and admin gallery editor on mobile and desktop for text overflow, broken images, and obvious layout regressions in `src/app/(site)/gallery/page.tsx` and `src/components/admin/site-content/gallery-manager.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2. Recommended MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2; can be implemented after or alongside US1 once shared manager/service scaffolding exists.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and the image list editor from US1.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 - Manage Gallery Images**: No dependency on US2 or US3 after foundation. This is the MVP.
- **US2 - Edit Gallery Copy**: No dependency on US3. Shares the same editor component and service save route as US1.
- **US3 - Control Gallery Presentation Order**: Depends on US1 image list editing behavior because ordering acts on the gallery image collection.

### Within Each User Story

- Service logic before route completion.
- Route completion before client component save integration.
- Admin editor integration before public/manual QA.
- Public gallery rendering must be checked at each story checkpoint.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 starts because they touch separate shared files.
- T007, T008, T010, and T011 can be scaffolded in parallel after T004-T006 establish shared types and service signatures.
- T012 and T021 can run in parallel because image fallback mapping and section fallback mapping are separate service slices.
- T015 can run in parallel with T016 once upload route contract is known.
- T025 can run in parallel with T024 after section response shape is stable.
- T032 can run in parallel with manual QA tasks once implementation details are known.

---

## Parallel Example: User Story 1

```bash
Task: "Implement gallery image DB read mapping and fallback image conversion from `fallbackGallery` in `src/services/site-content-service.ts`"
Task: "Complete image upload handling, image MIME validation, public URL response, and storage error responses in `src/app/api/admin/site-content/gallery/upload/route.ts`"
```

## Parallel Example: User Story 2

```bash
Task: "Add gallery section copy fields, character guidance, and validation display to `src/components/admin/site-content/gallery-manager.tsx`"
Task: "Render saved section eyebrow, title, description, feature-card title, and support-card body on the public gallery page in `src/app/(site)/gallery/page.tsx`"
```

## Parallel Example: User Story 3

```bash
Task: "Normalize `display_order` for submitted gallery images before persistence in `src/services/site-content-service.ts`"
Task: "Add move up/down or equivalent reorder controls to each image row in `src/components/admin/site-content/gallery-manager.tsx`"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for image add/edit/remove/replace.
3. Stop and validate User Story 1 independently on `/admin/site-content/gallery` and `/gallery`.
4. Confirm tenant isolation and zero-image behavior before adding copy/order polish.

### Incremental Delivery

1. Foundation ready: schema, service contracts, route shells, admin page shell.
2. US1: image management and public gallery render.
3. US2: section copy editing.
4. US3: reorder controls and order persistence.
5. Final validation: quickstart, tenant isolation, `npm test`, `npm run lint`.

### Parallel Team Strategy

With multiple implementers:

1. One implementer owns migration/types/validation.
2. One implementer owns service and route completion.
3. One implementer owns admin/public UI after service signatures are stable.
4. Keep write ownership coordinated for `src/services/site-content-service.ts` and `src/components/admin/site-content/gallery-manager.tsx`.
