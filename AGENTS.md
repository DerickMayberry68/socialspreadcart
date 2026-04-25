# SocialSpreadCart Codex Instructions

## Spec-Driven Development

- Treat this repository as spec-first. For new features, material behavior changes, admin workflows, data model changes, public site content changes, or multi-tenant changes, run the Spec Kit workflow before implementation.
- Use the repo-scoped Spec Kit skills in `.agents/skills`:
  - `$speckit-specify` to create or update the feature specification.
  - `$speckit-clarify` when the spec has unresolved product questions.
  - `$speckit-plan` to produce the implementation plan and design artifacts.
  - `$speckit-tasks` to generate implementation tasks.
  - `$speckit-analyze` before implementation when spec, plan, and tasks need consistency checks.
  - `$speckit-implement` only after the spec, plan, and tasks are ready.
- If the user asks for code changes without mentioning specs, pause long enough to create or update the appropriate spec unless the change is clearly trivial.
- Keep `.specify/feature.json` pointed at the active feature directory so downstream Spec Kit steps use the correct spec.

## Project-Specific Rules

- Never use `window.alert`, `window.confirm`, or `window.prompt`. Use Radix-based modals (see `HandledErrorAlert`, `UnsavedChangesDialog`) or toasts (`sonner`) as appropriate.
- SocialSpreadCart is a shared multi-tenant platform. New clients are tenant-scoped records in the existing database, not separate databases.
- Admin-editable public content must go through `SiteContentService` in `src/services/site-content-service.ts`; do not read site content tables directly from pages or components.
- Admin API routes under `src/app/api/admin/site-content/**` must start with `requireTenantAdmin()` and short-circuit on guard errors.

## Active Feature Context

- `013-admin-about-content`: Adds admin-editable About page copy, About images, and three About feature cards.
- Stack remains TypeScript 5.6, React 19.2, Next.js 15.5 App Router, Supabase, Tailwind CSS 3.4, Zod 4.3, Radix Dialog handled error alerts, and `sonner` success/info notifications.
- Planned storage adds tenant-scoped `about_page_content`, `about_images`, and `about_feature_cards` records, plus About uploads in the existing `boards` bucket under `{tenantId}/about/`.
