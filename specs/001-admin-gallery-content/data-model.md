# Data Model: Admin Gallery Content

## Overview

Gallery content is tenant-scoped public site content. Each tenant has one editable gallery section record and zero or more gallery image records. Public reads may fall back to in-memory defaults; admin writes are restricted to tenant admins/owners.

## Entity: Gallery Section Content

Represents the visitor-facing copy around the public gallery image collection.

### Fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `tenant_id` | UUID | Yes | Primary key; references the client site tenant. |
| `eyebrow` | Text | Yes | 0-40 characters. Defaults to `Gallery`. |
| `title` | Text | Yes | 1-180 characters. Main gallery heading. |
| `description` | Text | Yes | 1-500 characters. Intro/supporting copy near the heading. |
| `feature_card_eyebrow` | Text | Yes | 0-60 characters. Small label for the larger copy card. |
| `feature_card_title` | Text | Yes | 1-220 characters. Larger supporting statement near the gallery. |
| `support_card_body` | Text | Yes | 1-320 characters. Short supporting paragraph near the gallery. |
| `updated_at` | Timestamp | Yes | Set on each successful save. |
| `updated_by` | UUID | No | References the admin user who last saved the record. |

### Validation Rules

- `tenant_id` must be a valid tenant.
- Required text fields must be trimmed before persistence.
- Empty optional display labels are allowed only where the UI can hide or render them cleanly.
- Saved copy must stay within limits so public layout remains readable.

### Relationships

- One `Client Site` has exactly zero or one `Gallery Section Content` row.
- Missing rows are filled from default gallery section copy by the service layer.

## Entity: Gallery Image

Represents one image shown in the public gallery.

### Fields

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | UUID | Yes | Primary key generated for each gallery image. |
| `tenant_id` | UUID | Yes | References the client site tenant. |
| `display_order` | Integer | Yes | Positive integer; public display sorts ascending. |
| `title` | Text | Yes | 1-140 characters. Used as visitor-facing title and default accessible label. |
| `eyebrow` | Text | Yes | 0-60 characters. Small category or label above title. |
| `alt_text` | Text | Yes | 1-180 characters. Describes the image for assistive technologies. |
| `image_url` | Text | Yes | 1-2048 characters. Public URL or public path for the image. |
| `storage_path` | Text | No | Storage object path when uploaded through admin. |
| `is_active` | Boolean | Yes | Defaults to true. Inactive records are hidden from public gallery. |
| `created_at` | Timestamp | Yes | Set when record is created. |
| `updated_at` | Timestamp | Yes | Set on each successful save. |
| `updated_by` | UUID | No | References the admin user who last saved the record. |

### Validation Rules

- Each active image must have `title`, `alt_text`, and `image_url`.
- `display_order` values are normalized by the service on save so active images display as a stable ordered list.
- `image_url` must point to an approved site path or public media URL accepted by existing image rendering rules.
- `storage_path` is optional because fallback/static images may not originate from Supabase Storage.

### Relationships

- One `Client Site` has zero or more `Gallery Image` rows.
- Gallery images belong only to the tenant identified by `tenant_id`.

### State Transitions

| State | Meaning | Transition |
|-------|---------|------------|
| Draft in admin form | Unsaved local image row or edited copy. | Created when admin adds/edits before save. |
| Active saved | Image is persisted and visible on public gallery. | Created by valid PATCH save with `is_active = true`. |
| Removed from gallery | Image no longer appears publicly. | Reconciled by PATCH omission or `is_active = false`. |
| Orphaned media | Uploaded file no longer referenced by active rows. | Possible after replace/remove; cleanup deferred. |

## Entity: Client Site

Represents the tenant-owned public site.

### Existing Fields Used

| Field | Purpose |
|-------|---------|
| `id` | Scopes gallery section and image records. |
| `slug` | Identifies the active public/admin tenant context. |
| `name` | Provides fallback/default content where needed. |

## Database Constraints

- `gallery_section_content.tenant_id` is the primary key.
- `gallery_images.id` is the primary key.
- `gallery_images.tenant_id` references `tenants.id` with cascade delete.
- `gallery_images.display_order` must be greater than zero.
- Recommended unique constraint: `(tenant_id, display_order)` for active image ordering, or service-level normalization if soft deletion complicates uniqueness.
- Text length checks mirror Zod validation limits.

## RLS Policy Shape

### Public Select

- `gallery_section_content` and active `gallery_images` can be selected by anonymous and authenticated users so public pages render normally.

### Admin Writes

- Insert, update, and delete/reconcile operations are allowed only when `tenant_id` is in `admin_tenant_ids_for_current_user()`.
- Route handlers still call `requireTenantAdmin()` before invoking service writes.

## Fallback Model

If Supabase is unavailable, a row is missing, or the gallery has never been edited:

- Gallery section content falls back to the current hardcoded gallery heading and support-card copy.
- Gallery images fall back to `fallbackGallery` for first-time tenants.
- If a tenant explicitly saves zero images, the public page renders zero images instead of falling back to defaults.

## Service Return Shape

```ts
type GalleryPageContent = {
  section: GallerySectionContent;
  images: GalleryImage[];
};
```

The service always returns a populated `section` object. `images` may be an empty array.
