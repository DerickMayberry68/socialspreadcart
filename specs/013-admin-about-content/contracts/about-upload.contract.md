# Contract: About Image Upload

## Upload Image

`POST /api/admin/site-content/about/upload`

Accepts one image file for the current tenant's About page.

### Request

`multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `file` | Yes | Image file selected by the admin |

### Success Response

```json
{
  "ok": true,
  "imageUrl": "https://.../storage/v1/object/public/boards/{tenantId}/about/...",
  "path": "{tenantId}/about/..."
}
```

### Failure Responses

`400`

```json
{
  "ok": false,
  "message": "Only image files can be uploaded."
}
```

`401` or `403`

```json
{
  "ok": false,
  "message": "You must be signed in as an admin."
}
```

`500`

```json
{
  "ok": false,
  "message": "Failed to upload About image."
}
```

## UI Feedback Contract

- Upload success is shown as a non-blocking toast.
- Upload failure is shown in a modal alert.
- Handled failures must not expose stack traces, raw call stacks, or framework internals.
- Cancelling file selection leaves current editor state unchanged.
