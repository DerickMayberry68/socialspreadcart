# Contract: Pathway Cards

**Feature**: 012-admin-editable-hero-and-cards
**Resources**:
- `/api/admin/site-content/pathway-cards` — GET, PATCH (bulk upsert of 3)
- `/api/admin/site-content/pathway-cards/upload` — POST (image upload)

Auth: admin/owner role in the current tenant. Unauthenticated → 401.
Non-admin → 403.

---

## GET `/api/admin/site-content/pathway-cards`

Load the current tenant's three pathway cards in display order.
Always returns an array of exactly three records (seeded via
trigger or migration).

### Response 200

```json
{
  "ok": true,
  "data": [
    {
      "displayOrder": 1,
      "title": "Pickup for gifting and easy hosting",
      "body": "Order polished boxes...",
      "badge": "Fastest path",
      "linkTarget": "/menu",
      "imageUrl": "https://...",
      "updatedAt": "2026-04-21T12:34:56.000Z"
    },
    { "displayOrder": 2, "...": "..." },
    { "displayOrder": 3, "...": "..." }
  ]
}
```

---

## PATCH `/api/admin/site-content/pathway-cards`

Bulk upsert of all three pathway cards. The request body MUST
contain exactly three cards, covering `displayOrder` 1, 2, and 3
exactly once. Reordering is expressed by reassigning `displayOrder`
on the client before submit.

### Request body

```json
{
  "cards": [
    {
      "displayOrder": 1,
      "title": "Cart service that becomes part of the decor",
      "body": "A styled setup for showers...",
      "badge": "Event favorite",
      "linkTarget": "/contact",
      "imageUrl": "https://.../cart-umbrella-wide.jpg"
    },
    {
      "displayOrder": 2,
      "title": "Pickup for gifting and easy hosting",
      "body": "...",
      "badge": "",
      "linkTarget": "/menu",
      "imageUrl": "https://.../charcuterie-spread.jpg"
    },
    {
      "displayOrder": 3,
      "title": "Pop-ups worth planning around",
      "body": "...",
      "badge": "Community favorite",
      "linkTarget": "/events",
      "imageUrl": "https://.../cart-dirty-soda-hero.jpg"
    }
  ]
}
```

### Validation rules (per card)

| Field | Rule |
|-------|------|
| `displayOrder` | Integer in `{1, 2, 3}`; unique across the three cards in the request |
| `title` | 1–80 chars |
| `body` | 1–200 chars |
| `badge` | 0–24 chars |
| `linkTarget` | 1–2048 chars; must be `/...` or `https://...` |
| `imageUrl` | 1–2048 chars; must be `/...` or `https://...` |

### Request-level rules

- Exactly 3 cards.
- `displayOrder` values form the set `{1, 2, 3}` with no duplicates
  and no gaps.

### Response 200

```json
{ "ok": true, "data": [ /* full list of 3 as returned by GET */ ] }
```

On success calls `revalidateTag("site-content:{tenantId}")` and
`revalidatePath("/")`.

### Response 400

```json
{
  "ok": false,
  "message": "Invalid input.",
  "errors": [
    { "path": "cards[1].linkTarget", "message": "Must start with / or https://" }
  ]
}
```

### Response 401 / 403 / 500

```json
{ "ok": false, "message": "..." }
```

---

## POST `/api/admin/site-content/pathway-cards/upload`

Upload a new image for a pathway card. Returns the public URL and
the storage path; the admin form then sets the card's `imageUrl`
and includes it in the next PATCH to `/pathway-cards`.

This endpoint does **not** write to `pathway_cards` itself — it
only uploads to storage. The PATCH to `/pathway-cards` is what
persists the new `imageUrl`.

### Request

`multipart/form-data` with one `file` field:

```
POST /api/admin/site-content/pathway-cards/upload
Content-Type: multipart/form-data; boundary=...

file=<binary image>
```

### Validation rules

- `file` MUST be present and be a `File`.
- `file.type` MUST start with `image/`.
- Filename is slugified and uniquified with a timestamp + UUID.

### Storage location

```
bucket: boards
key:    {tenantId}/pathway-cards/{timestamp}-{slug}-{uuid}.{ext}
```

### Response 200

```json
{
  "ok": true,
  "imageUrl": "https://.../boards/{tenantId}/pathway-cards/....jpg",
  "path": "{tenantId}/pathway-cards/....jpg"
}
```

### Response 400

```json
{ "ok": false, "message": "Only image files can be uploaded." }
```

### Response 401 / 403 / 500

```json
{ "ok": false, "message": "..." }
```

---

## Public-Rendering Contract (informational)

The public home page does **not** call these admin endpoints. It
calls the service directly via `SiteContentService.loadHomePageContent(tenantId)`,
which returns `{ siteConfig, hero, pathwayCards }`. The service
fills any missing record with the defaults documented in
`data-model.md` so the home page always has three cards and a
fully populated hero. The service read is wrapped in a cache with
tag `site-content:{tenantId}`, invalidated by the PATCH handlers
above.
