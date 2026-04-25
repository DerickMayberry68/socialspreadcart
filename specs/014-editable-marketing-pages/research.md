# Research: Editable Marketing Pages

## Decision: Use one tenant-scoped `marketing_page_content` table for remaining page-level content

**Rationale**: The remaining gaps are mostly typed page sections rather than relational operational records. A single page-keyed table avoids creating many small singleton tables while still allowing strong validation at the service boundary.

**Alternatives considered**:
- One table per page: clearer SQL shape but more migration and service boilerplate for low-volume singleton records.
- Fully generic CMS blocks: more flexible but larger UX/product surface than requested.

## Decision: Preserve existing specialized editors

**Rationale**: Hero, pathway cards, gallery, about, menu items, events, quotes, and contacts already have working admin flows and should not be destabilized.

**Alternatives considered**:
- Move all existing content into a generic CMS model: more consistent long-term, but high migration risk and unnecessary for this request.

## Decision: Validate JSON content with page-specific Zod schemas

**Rationale**: JSON storage keeps schema churn low while Zod preserves typed field validation, bounded lists, URL validation, and stable public rendering shapes.

**Alternatives considered**:
- Store unchecked JSON and trust forms: faster but risks broken public pages.
- Store every field as columns: stricter SQL shape but heavy for page sections that may evolve.

## Decision: Store image URLs and alt text in page content first

**Rationale**: Existing editors already support URL/image fields. The user needs editable images now, and upload support can continue to use existing upload routes where present or be added later as a refinement.

**Alternatives considered**:
- Build a full media manager: too broad for this pass.
- Add per-page upload routes immediately for every page: useful but increases scope beyond the core editability requirement.

## Decision: Use immediate publish with cache/path revalidation

**Rationale**: This matches existing site-content behavior and avoids adding draft/scheduling complexity.

**Alternatives considered**:
- Draft and publish workflow: better editorial safety but not requested and heavier to build.
