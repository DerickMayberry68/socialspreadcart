# Implementation Plan: Admin Event Image Upload

**Branch**: `024-admin-event-image-upload` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/024-admin-event-image-upload/spec.md`

## Summary

Add an image chooser/upload flow to the existing Admin Events editor so admins can create or edit events without manually hosting image files. The implementation will reuse the project's existing tenant-scoped public image upload pattern, add a dedicated event image upload route, and enhance the current event form with upload state, URL population, and preview.

## Technical Context

**Language/Version**: TypeScript 5.6, React 19.2, Next.js 15.5 App Router  
**Primary Dependencies**: Supabase service role storage client, existing tenant/auth helpers, `sonner` toasts, existing admin UI components  
**Storage**: Supabase Storage public images in the existing `boards` bucket; existing `events.image_url` field remains the persisted event image reference  
**Testing**: Vitest and Testing Library for component/route-adjacent coverage; `npm run build` for production validation  
**Target Platform**: Next.js web app deployed to Vercel  
**Project Type**: Single web application  
**Performance Goals**: Admin upload feedback should appear immediately; event save remains a single form action after upload completes  
**Constraints**: Must preserve tenant scoping, existing manual URL entry, optional event images, and project rule against browser alert/confirm/prompt dialogs  
**Scale/Scope**: One admin editor and one upload endpoint; no full media library or image browsing system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec-first workflow**: Pass. Spec, plan, and task artifacts are created before implementation.
- **Tenant isolation**: Pass. Event uploads will be tenant-scoped under the active tenant.
- **Admin workflow safety**: Pass. Existing auth and tenant checks are reused; errors use handled responses and toasts.
- **No browser dialogs**: Pass. Upload feedback uses existing toast/modal-style patterns, not browser-native dialogs.
- **Minimal scope**: Pass. The feature improves the existing Events form and upload path without adding a media library or schema changes.

## Project Structure

### Documentation (this feature)

```text
specs/024-admin-event-image-upload/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── event-image-upload.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/api/admin/events/upload/route.ts
└── components/admin/event-manager.tsx

tests/
├── api/admin-events-upload-route.test.ts
└── components/admin/event-manager.test.tsx
```

**Structure Decision**: Keep the feature inside the existing Next.js app. Add a dedicated event upload route next to the existing Events API and update the existing admin event manager component.

## Complexity Tracking

No constitution violations or exceptional complexity are expected.
