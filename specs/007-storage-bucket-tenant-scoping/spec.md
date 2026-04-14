# Feature Specification: Storage Bucket Tenant Scoping

**Feature Branch**: `007-storage-bucket-tenant-scoping`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Scope the existing Supabase storage buckets (boards, events) to per-tenant path prefixes with RLS, so each tenant can only upload/download its own images. Add a new logos bucket for brand assets."

## Context

Spec 002 explicitly deferred storage to this feature. Today the `boards`
and `events` buckets have cosmetic RLS (`bucket_id = 'boards'` with no
tenant scoping), so any authenticated user can theoretically upload to
or delete from any tenant's images. Spec 005 introduced brand logos but
assumed public URLs; this feature makes those assumptions real.

The approach is path-prefix scoping: every object's key starts with
`tenants/<tenant_id>/...`. Storage RLS policies check that the path
prefix matches a tenant the user belongs to. Public reads remain public
for the `boards` and `events` and `logos` buckets (they are served on
public pages) but writes are tenant-scoped.

## User Scenarios & Testing

### User Story 1 — Tenant Uploads Stay In Their Folder (Priority: P1)

An authenticated tenant A user uploads an image to the `boards` bucket.
The service layer constructs the object key as
`tenants/<A>/boards/<filename>` and sends it to Supabase. The RLS policy
confirms the path prefix belongs to a tenant the user is a member of.
Tenant B users cannot upload to tenant A's prefix.

**Why this priority**: Without path scoping, one tenant could overwrite
or delete another tenant's images. This is a data-integrity bug, not a
privacy bug (images are publicly readable), but it's still a bug.

**Independent Test**: As tenant A, upload an image. Confirm it lands at
`tenants/<A>/boards/...`. As tenant B, attempt to upload to the same
prefix. Confirm rejection.

**Acceptance Scenarios**:

1. **Given** tenant A user authenticated, **When** they upload to
   `tenants/<A>/boards/photo.jpg`, **Then** the upload succeeds.
2. **Given** tenant A user authenticated, **When** they attempt to
   upload to `tenants/<B>/boards/photo.jpg`, **Then** Supabase returns
   a policy violation.
3. **Given** tenant A user authenticated, **When** they attempt to
   delete an object under `tenants/<B>/boards/`, **Then** the delete
   fails.

---

### User Story 2 — Public Reads Still Work (Priority: P1)

The public site continues to load board and event images from the
`boards` and `events` buckets without authentication. Tenant scoping
does NOT restrict reads — these images are intended to be publicly
visible on each tenant's public site.

**Why this priority**: The whole point of the buckets is public display.

**Independent Test**: Load the home page. Confirm images render for
the legacy tenant after the migration.

**Acceptance Scenarios**:

1. **Given** an object at `tenants/<A>/boards/photo.jpg`, **When** any
   anonymous visitor requests the object URL, **Then** the image is
   served.

---

### User Story 3 — New `logos` Bucket (Priority: P2)

A new `logos` bucket is created for brand logos. Writes are tenant-scoped
the same way as `boards`. Reads are public. The BrandService from Spec 005
uses URLs from this bucket.

**Why this priority**: Spec 005's brand logos need a home. Without this
feature, they live in `public/brand/` in the repo — not editable per
tenant.

**Independent Test**: As tenant A, upload a horizontal logo. Set the
tenant's `logo_horizontal_url` to the resulting URL. Confirm it renders
on tenant A's site.

**Acceptance Scenarios**:

1. **Given** the `logos` bucket exists, **When** tenant A uploads to
   `tenants/<A>/logos/horizontal.svg`, **Then** the upload succeeds.
2. **Given** the brand record references the uploaded URL, **When** the
   tenant's site renders, **Then** the `<Logo>` component shows the
   uploaded logo.

---

### User Story 4 — Legacy Objects Are Migrated In Place (Priority: P3)

Existing objects in the `boards` and `events` buckets are migrated to
the `tenants/<legacy>/boards/...` and `tenants/<legacy>/events/...`
prefixes during the migration. The existing public URLs can be
preserved via a storage-layer rename (Supabase storage supports
renaming objects) or via a redirect/rewrite in middleware.

**Why this priority**: One-time operational hygiene.

**Independent Test**: After migration, all existing images still load
on the public site. Their URLs may or may not have changed; if they
changed, the page references are updated.

**Acceptance Scenarios**:

1. **Given** a pre-existing object, **When** the migration runs,
   **Then** the object is accessible at the new tenant-scoped path.
2. **Given** a component that hardcoded a public URL to a pre-migration
   path, **When** the page renders post-migration, **Then** the image
   still loads (either because the URL was rewritten or because a
   redirect exists).

---

### Edge Cases

- **Path traversal attempts** (`tenants/<A>/../B/...`): Supabase
  normalises paths before policy evaluation; confirm in tests.
- **Very long tenant slugs**: the path prefix uses tenant UUID, not
  slug, so length is fixed.
- **Content-type spoofing**: orthogonal to this feature; handled by
  Supabase's mime sniffing.
- **Buckets created outside this feature**: any new bucket introduced
  later MUST follow the same `tenants/<id>/<bucket>/...` convention;
  documented in the constitution's Technology Stack section.

## Requirements

### Functional Requirements

- **FR-001**: A new `logos` bucket MUST be created with `public = true`.
- **FR-002**: A new helper function
  `public.path_tenant_id(object_path text) returns uuid` MUST exist
  that parses the first two path segments and returns the tenant UUID
  if the path starts with `tenants/<uuid>/`, or NULL otherwise.
- **FR-003**: RLS policies on `storage.objects` MUST be rewritten for
  the `boards`, `events`, and `logos` buckets so that insert, update,
  and delete require the caller to be a member of the tenant identified
  by `path_tenant_id(name)`.
- **FR-004**: Public `select` on the three buckets remains `using
  (true)` — images are publicly readable.
- **FR-005**: The services that upload images MUST be updated to
  prepend `tenants/<tenantId>/` to every object key.
- **FR-006**: A one-time migration script (SQL + small Node script) MUST
  move every existing object in the `boards` and `events` buckets under
  the legacy tenant's prefix. The script MUST be idempotent and safe to
  re-run.
- **FR-007**: The constitution's Technology Stack section MUST be
  updated in a follow-up amendment to codify the
  `tenants/<id>/<bucket>/...` path convention.

### Key Entities

- **Object Path**: `tenants/<tenant_uuid>/<bucket_name>/<arbitrary>` is
  the canonical shape. This shape is enforced by RLS and by the
  services layer.

## Success Criteria

- **SC-001**: Attempts by tenant A to write objects under tenant B's
  prefix return a policy violation 100% of the time (verified by an
  extension to the Spec 002 isolation test suite).
- **SC-002**: Existing public images continue to load after the
  migration.
- **SC-003**: Tenant A can upload, list, and delete their own images
  via the admin shell without any cross-tenant leakage.
- **SC-004**: The `logos` bucket is created and brand logos upload and
  render successfully.

## Assumptions

- Supabase Storage RLS policies have access to `auth.uid()` and can
  call `public.tenant_ids_for_current_user()` — confirmed in Supabase
  documentation.
- Object paths use UUIDs (not slugs) to avoid rename issues if a tenant
  changes their slug in the future.
- The migration script runs once. After this feature lands, any new
  object that bypasses the services layer and uploads without the
  prefix will be rejected by the RLS policy.
- Content-type validation, virus scanning, and other file-hardening
  concerns are NOT in scope for this feature.
