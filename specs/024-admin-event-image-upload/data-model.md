# Data Model: Admin Event Image Upload

## Event

Existing public calendar record managed from Admin Events.

Fields involved in this feature:
- `id`: event identifier.
- `tenant_id`: owning tenant.
- `title`: public event title.
- `event_date` / time fields: public event timing.
- `location`: public event location.
- `description`: public event description.
- `image_url`: optional public URL for the event image.

Validation:
- Event image remains optional.
- If present, event image URL must be a valid public image URL.
- Event creation and update remain tenant-scoped.

## Event Image Upload

An uploaded image asset selected by a tenant admin for use in an event.

Attributes:
- `tenant_id`: owning tenant context.
- `file`: image file selected from the admin's device.
- `path`: tenant-prefixed storage location.
- `image_url`: public URL returned after upload.

Validation:
- File must exist.
- File must be an image.
- Upload errors must not alter the current event form image URL.

Lifecycle:
1. Admin chooses an image file in the event form.
2. System uploads the file in the current tenant context.
3. System returns a public image URL.
4. Event form populates `image_url` and shows a preview.
5. Event save persists the URL through the existing event create/update flow.

## No Schema Changes

No database schema changes are required. The existing event `image_url` field remains the source of truth for the public event image.
