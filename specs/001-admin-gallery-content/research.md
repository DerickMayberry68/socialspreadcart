# Phase 0 Research: Admin Gallery Content

## Decision: Extend `SiteContentService` for gallery content

**Rationale**: Gallery content is admin-editable public site content, just like site configuration, hero content, and pathway cards. Keeping gallery reads, writes, fallbacks, and cache invalidation in `SiteContentService` follows the constitution's services-layer rule and keeps public pages/components free of direct data access.

**Alternatives considered**:
- Separate `GalleryService`: rejected because this would split one content domain across two services while sharing the same auth, tenant, cache, fallback, and admin patterns.
- Keep `getGalleryItems()` in `src/lib/data.ts`: rejected because it currently returns fallback data only and cannot support tenant-scoped admin editing.

## Decision: Add `gallery_section_content` and `gallery_images`

**Rationale**: The public gallery has two different editing needs: page/section copy and a repeatable image collection. A singleton section row per tenant handles heading/supporting copy. A separate image table supports add/remove/reorder without arbitrary JSON editing and keeps image rows independently validated.

**Alternatives considered**:
- One JSON blob table: rejected because validation, ordering, and future per-image operations become harder to enforce.
- Add gallery fields to `site_configuration`: rejected because gallery copy and images are page-specific, not sitewide configuration.
- Reuse `pathway_cards`: rejected because pathway cards have fixed cardinality and link behavior; gallery images require variable cardinality.

## Decision: Use the existing `boards` storage bucket with a `gallery/` prefix

**Rationale**: Existing admin media uploads already use Supabase Storage and the `boards` bucket with tenant-scoped paths. Reusing the bucket avoids new infrastructure and keeps uploaded media accessible to the public site.

**Alternatives considered**:
- New `gallery` bucket: rejected for the first release because it adds setup and policy surface without a clear product need.
- Store images only as public paths from `public/`: rejected because the client needs admin upload capability.

## Decision: Whole-gallery PATCH for content saves

**Rationale**: The admin editor naturally manages the gallery as one ordered collection plus section copy. Sending the full desired state lets the service reconcile adds, edits, removals, and ordering in one save, and it avoids a larger set of item-level endpoints for the first release.

**Alternatives considered**:
- Separate POST/PATCH/DELETE routes per image: rejected for v1 because it increases UI state and route complexity without adding necessary client value.
- Separate reorder endpoint: rejected because order can be represented in the submitted image array.

## Decision: Zero-image gallery is valid

**Rationale**: The spec requires the public gallery to avoid broken placeholders when no images exist. A client admin may intentionally remove all images while preparing new content. The public page should still render editable copy and either hide image-only layout or show an intentional empty state.

**Alternatives considered**:
- Require at least one image: rejected because it blocks intentional cleanup and conflicts with the stated zero-image success criterion.
- Fall back to default images after all images are removed: rejected because it would make admin removal appear broken or ignored.

## Decision: Publish immediately after save and revalidate `site-content:{tenantId}`

**Rationale**: Existing admin-editable site content publishes immediately and invalidates the tenant site-content cache tag. Gallery content should match that mental model, and public gallery reads can use the same cache tag family.

**Alternatives considered**:
- Draft/publish workflow: rejected as out of scope and inconsistent with current admin content behavior.
- Time-based revalidation only: rejected because admins expect saved changes to appear promptly.

## Decision: Storage cleanup is deferred

**Rationale**: Removing or replacing a gallery image can leave an orphaned file in storage. At the expected scale, this is acceptable for v1 and avoids risking accidental deletion of media still referenced elsewhere. The saved gallery records remain the source of truth for public display.

**Alternatives considered**:
- Delete storage files on every remove/replace: rejected because shared references and failed partial saves need more safeguards than this feature requires.
- Scheduled cleanup job: rejected as future operational work, not required for the admin editing workflow.
