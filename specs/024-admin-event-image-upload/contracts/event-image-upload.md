# Contract: Event Image Upload

## Endpoint

`POST /api/admin/events/upload`

## Authorization

- Caller must be an authenticated admin user for the active tenant.
- Request must resolve a current tenant.
- Upload path must be tenant-scoped.

## Request

Multipart form data:

| Field | Required | Description |
|-------|----------|-------------|
| `file` | Yes | Image file selected by the admin |

## Success Response

Status: `200`

```json
{
  "ok": true,
  "imageUrl": "https://example.com/public/event-image.jpg",
  "path": "tenant-id/events/..."
}
```

## Error Responses

Unauthenticated:

Status: `401`

```json
{
  "ok": false
}
```

Missing storage configuration:

Status: `500`

```json
{
  "ok": false,
  "message": "Storage is unavailable."
}
```

Missing or invalid file:

Status: `400`

```json
{
  "ok": false,
  "message": "Please choose an image file."
}
```

Unsupported file type:

Status: `400`

```json
{
  "ok": false,
  "message": "Only image files can be uploaded."
}
```

Storage upload failure:

Status: `400`

```json
{
  "ok": false,
  "message": "Upload failure message."
}
```

## UI Contract

- Event form sends the selected file to the upload endpoint.
- While upload is active, upload button and event save are disabled.
- On success, event form fills `image_url` with `imageUrl`.
- On failure, event form keeps the previous `image_url` unchanged and shows a handled error.
