# Page Content Contracts

## Admin Load Page Content

`GET /api/admin/site-content/page-content/{pageKey}`

### Path Parameters

- `pageKey`: One of `shell`, `home`, `menu`, `events`, `cart-service`, `contact`.

### Success Response

```json
{
  "ok": true,
  "pageKey": "home",
  "content": {},
  "updatedAt": "2026-04-24T00:00:00.000Z",
  "updatedBy": "user-id-or-null"
}
```

`content` is the complete typed payload for the requested page key, including fallback defaults for missing fields.

### Failure Responses

- `401` when unauthenticated.
- `403` when the user is not a tenant admin.
- `404` when the page key is unsupported.
- `500` when content cannot be loaded.

## Admin Save Page Content

`PATCH /api/admin/site-content/page-content/{pageKey}`

### Request Body

```json
{
  "content": {}
}
```

The `content` shape depends on `pageKey` and is validated before persistence.

### Success Response

```json
{
  "ok": true,
  "pageKey": "home",
  "content": {},
  "updatedAt": "2026-04-24T00:00:00.000Z",
  "updatedBy": "user-id"
}
```

### Failure Responses

- `400` for invalid fields.
- `401` when unauthenticated.
- `403` when the user is not a tenant admin.
- `404` when the page key is unsupported.
- `500` when the save fails unexpectedly.

Invalid saves must preserve the previously published content.

## Public Loader Contract

`SiteContentService.getMarketingPageContent(tenantId, pageKey)` returns:

```json
{
  "tenant_id": "tenant-id",
  "page_key": "home",
  "content": {},
  "updated_at": "2026-04-24T00:00:00.000Z",
  "updated_by": null
}
```

Public loaders must return complete content by merging saved content over page defaults.
