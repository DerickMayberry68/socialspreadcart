# Data Model: Admin About Content

## About Page Content

Represents the singleton About page copy for a tenant.

**Fields**
- `tenant_id`: Client site owner. Required. One row per tenant.
- `eyebrow`: Short label above the page heading. Optional, max 40 characters.
- `title`: Main About page heading. Required, max 220 characters.
- `description`: Intro description below the heading. Required, max 600 characters.
- `story_badge`: Short label inside the story card. Optional, max 60 characters.
- `story_title`: Main story card headline. Required, max 240 characters.
- `story_body`: Ordered list of story paragraphs. Required, 1-4 paragraphs, each max 700 characters.
- `updated_at`: Last update timestamp.
- `updated_by`: Admin user who last updated content, nullable for seeds/backfills.

**Validation Rules**
- Required copy cannot be blank after trimming.
- `story_body` must contain at least one non-empty paragraph.
- Text limits mirror admin field limits and database checks.

**Relationships**
- Belongs to one Client Site through `tenant_id`.

## About Image

Represents an image displayed in the public About page image grid.

**Fields**
- `id`: Image row identifier.
- `tenant_id`: Client site owner. Required.
- `display_order`: Positive integer used for ordering.
- `image_url`: Public image URL or site-relative image path. Required, max 2048 characters.
- `storage_path`: Optional storage key for uploaded images.
- `alt_text`: Required descriptive text, max 180 characters.
- `is_active`: Whether the image is rendered publicly.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.
- `updated_by`: Admin user who last updated image, nullable for seeds/backfills.

**Validation Rules**
- `image_url` and `alt_text` are required for active images.
- `display_order` must be positive and unique per tenant.
- Public rendering sorts active images by `display_order`.

**Relationships**
- Belongs to one Client Site through `tenant_id`.

## About Feature Card

Represents one of the three cards displayed below the About story.

**Fields**
- `tenant_id`: Client site owner. Required.
- `display_order`: Required fixed value 1, 2, or 3.
- `title`: Card heading. Required, max 80 characters.
- `body`: Card body copy. Required, max 220 characters.
- `icon_key`: Existing visual identity key. Required, max 40 characters.
- `updated_at`: Last update timestamp.
- `updated_by`: Admin user who last updated card, nullable for seeds/backfills.

**Validation Rules**
- Exactly three cards are saved for each tenant.
- `display_order` must be one of 1, 2, or 3 and unique per tenant.
- `title` and `body` cannot be blank after trimming.
- `icon_key` is controlled by the application and remains fixed by display order in v1.

**Relationships**
- Belongs to one Client Site through `tenant_id`.

## About Page Content Bundle

The service-level read model consumed by admin and public pages.

**Fields**
- `content`: About Page Content
- `images`: Ordered About Image collection
- `featureCards`: Exactly three About Feature Cards ordered by `display_order`

**State Rules**
- If no saved content exists, the bundle uses fallback About content.
- If saved content exists but image/card rows are missing, the service uses safe fallbacks for missing groups.
- Admin PATCH returns the canonical saved bundle after validation and persistence.

## Client Site

Represents the tenant-owned public site.

**Relationships**
- Owns one About Page Content row.
- Owns zero or more About Image rows.
- Owns exactly three About Feature Card rows after seed/backfill.

**Security Rules**
- Public visitors can read active About content through the public page.
- Only admins/owners of the current client site can create, update, or delete About content rows.
