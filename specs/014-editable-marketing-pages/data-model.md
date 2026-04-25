# Data Model: Editable Marketing Pages

## Marketing Page Content

Tenant-scoped saved content for one public marketing page or shared shell area.

### Fields

- `tenant_id`: Client site owner.
- `page_key`: Stable key for the content area. Supported keys: `shell`, `home`, `menu`, `events`, `cart-service`, `contact`.
- `content`: Structured page payload validated by the service for the page key.
- `updated_at`: Last save timestamp.
- `updated_by`: Admin user who last saved the content.

### Constraints

- One row per `tenant_id` and `page_key`.
- `page_key` must be one of the supported keys.
- RLS must allow public reads and tenant-admin writes only.
- Service validation must reject invalid payloads before persistence.

## Page Content Payloads

### Shell Content

Shared navigation labels/order, header strip copy, footer CTA/story copy, footer description, location, phone, email, Instagram URL, and booking CTA.

### Home Page Content

Remaining Home sections not covered by hero/pathway cards: proof stats, visual card labels, pillars, menu/event/gallery section headings, cart/service story copy, booking steps, CTA copy, and related image URLs/alt text.

### Menu Page Content

Page heading copy, intro card, support cards for pickup/delivery/lead times, and optional image content. Menu item records remain separate.

### Events Page Content

Page heading copy and explanatory support cards. Event records remain separate.

### Cart Service Page Content

Page heading copy, gallery image collection, included item list, service chips, CTA label/target, and image alt text.

### Contact Page Content

Page heading copy, planning card, contact/expectation cards, and labels used around the quote form. Quote submissions and contact records remain separate.

## Editable Image

Represents a visitor-facing image inside a page payload.

### Fields

- `image_url`: Public URL or path.
- `alt_text`: Required descriptive text.
- `title` or `label`: Optional display copy when the page renders a caption.

## Validation Rules

- Required headings, labels, and body copy must be non-empty.
- URL fields must be relative site paths, root-relative asset paths, or absolute HTTP(S) URLs as appropriate.
- Repeatable lists must have bounded min/max counts matching the page layout.
- Image entries must include `image_url` and `alt_text`.
- Unknown page keys must be rejected.

## Lifecycle

1. Tenant admin opens a page editor.
2. Service returns saved content merged with fallback defaults.
3. Admin edits and saves the full page payload.
4. API validates tenant admin access and payload shape.
5. Service upserts the tenant/page row and invalidates content cache/path.
6. Public page renders the saved content, or fallback content if unavailable.
