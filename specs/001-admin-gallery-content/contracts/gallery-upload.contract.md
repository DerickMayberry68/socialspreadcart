# Contract: Gallery Upload

## Scope

Upload one gallery image file from Admin Site Content and return a public image URL that can be attached to a gallery image row.

## Route

`POST /api/admin/site-content/gallery/upload`

## Authorization

- Must call `requireTenantAdmin()` before reading or uploading the file.
- Only admins/owners for the active tenant may upload gallery images.

## Request

Content type: `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | Yes | Must be an image file. |

## Storage Behavior

- Bucket: `boards`
- Object key prefix: `{tenantId}/gallery/`
- Filename should include a timestamp, slugified source name, and random UUID.
- Uploads must not overwrite existing files.

## Success Response

Status: `200`

```json
{
  "ok": true,
  "imageUrl": "https://public-storage-url/tenant-id/gallery/file.jpg",
  "path": "tenant-id/gallery/file.jpg"
}
```

## Error Responses

### Missing File

Status: `400`

```json
{
  "ok": false,
  "message": "Please choose an image file."
}
```

### Unsupported File Type

Status: `400`

```json
{
  "ok": false,
  "message": "Only image files can be uploaded."
}
```

### Unauthorized

Status: `401` or `403`

Uses the existing `requireTenantAdmin()` error response shape.

### Storage Not Configured

Status: `500`

```json
{
  "ok": false,
  "message": "Supabase storage is not configured."
}
```

### Storage Failure

Status: `400`

```json
{
  "ok": false,
  "message": "Storage provider error message"
}
```

## Follow-up Contract

The upload route does not create or update gallery records by itself. The admin editor must include the returned `imageUrl` and `path` in the next gallery content PATCH request.
