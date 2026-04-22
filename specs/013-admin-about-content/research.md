# Research: Admin About Content

## Decision: Extend `SiteContentService` for About content

**Rationale**: About content shares the same tenant scoping, fallback behavior, cache invalidation, admin auth boundary, and public render pattern as Site Configuration, Hero, Pathway Cards, and Gallery. Keeping it in `SiteContentService` preserves the existing service-layer boundary required by the constitution.

**Alternatives considered**:
- **Create `AboutContentService`**: Rejected because it would duplicate cache, fallback, and tenant patterns without enough domain separation.
- **Fetch Supabase directly in pages/routes**: Rejected because it violates the services-layer requirement.

## Decision: Use three tenant-scoped data groups

**Rationale**: The current About page has three editorial surfaces: page/story copy, image grid, and feature cards. Separate tables keep constraints narrow and let the service validate each group independently while returning one complete `AboutPageContent` bundle to callers.

**Alternatives considered**:
- **Single JSON content blob**: Rejected because validation, RLS clarity, ordering, and future admin UI changes would be harder to reason about.
- **One row per field**: Rejected because it is too generic and would complicate public rendering.

## Decision: Save the whole About editor state in one PATCH

**Rationale**: A whole-state save matches the Gallery editor and keeps add/remove/reorder/edit behavior deterministic. It also makes the admin UI simpler because the saved response can replace local state with the canonical server state.

**Alternatives considered**:
- **Separate endpoints per field/image/card**: Rejected for v1 because it adds route surface area and partial failure complexity.
- **Autosave**: Rejected because existing Site Content sections use explicit save and publish immediately.

## Decision: Reuse the existing `boards` storage bucket with an `about/` path prefix

**Rationale**: Existing site content uploads already use the public `boards` bucket with tenant-scoped keys. Reusing it avoids bucket configuration drift and preserves the same admin upload permissions and public image serving behavior.

**Alternatives considered**:
- **Create a new About bucket**: Rejected because it adds operations overhead without meaningful isolation gains for this v1.
- **Only allow manual URLs**: Rejected because the client needs practical image replacement from admin.

## Decision: Exactly three editable feature cards with fixed icon mapping

**Rationale**: The public About page currently renders three cards in a fixed layout. Letting admins edit title/body while keeping the existing visual icon mapping preserves brand polish and avoids introducing an icon picker that does not materially improve the requested content editing workflow.

**Alternatives considered**:
- **Variable card count**: Rejected because it would require public layout decisions outside the requested scope.
- **Editable icons**: Rejected for v1 because it adds UX complexity and brand-risky choices.

## Decision: Modal alerts for handled failures, toasts for success/info

**Rationale**: The user explicitly requested that handled exceptions never show stacks and that handled failures appear in a SweetAlert-style box rather than toasts, while notification messages remain acceptable as toasts. The existing `HandledErrorAlert` component provides that modal channel without adding a new dependency.

**Alternatives considered**:
- **Use `toast.error` for all failures**: Rejected by user preference.
- **Add a SweetAlert package**: Rejected because Radix Dialog is already installed and sufficient for the desired modal alert behavior.
