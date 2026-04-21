# Contract: Site Configuration

**Feature**: 012-admin-editable-hero-and-cards
**Resource**: `/api/admin/site-content/site-configuration`

All endpoints require an authenticated session whose user has an
`owner` or `admin` role in the current tenant (resolved via
`getCurrentTenant()`). Unauthenticated → 401. Non-admin → 403.

Content-type for requests and responses: `application/json`.

---

## GET

Load the current tenant's site configuration. Always returns a
record (seeded via trigger or migration).

### Response 200

```json
{
  "ok": true,
  "data": {
    "brandName": "The Social Spread",
    "brandTagline": "Premium cart hospitality in Northwest Arkansas",
    "bookingCtaLabel": "Book the Cart",
    "bookingCtaTarget": "/contact",
    "supportPhone": null,
    "supportEmail": null,
    "updatedAt": "2026-04-21T12:34:56.000Z"
  }
}
```

### Response 401 / 403

```json
{ "ok": false, "message": "..." }
```

---

## PATCH

Upsert the site configuration for the current tenant. Partial
updates are supported; any field omitted from the body is left
unchanged.

### Request body

```json
{
  "brandName": "The Social Spread",
  "brandTagline": "Snacks & sips, served your way.",
  "bookingCtaLabel": "Book The Social Spread",
  "bookingCtaTarget": "/contact",
  "supportPhone": "479-555-0100",
  "supportEmail": "hello@thesocialspread.com"
}
```

### Validation rules (service + Zod)

| Field | Rule |
|-------|------|
| `brandName` | 1–80 chars |
| `brandTagline` | 0–140 chars |
| `bookingCtaLabel` | 1–32 chars |
| `bookingCtaTarget` | Starts with `/` **or** matches `^https://` ; max 2048 chars |
| `supportPhone` | 0–32 chars, may be null |
| `supportEmail` | Valid email syntax when non-null; max 254 chars |

### Response 200

```json
{
  "ok": true,
  "data": { "...full record as GET..." }
}
```

On success the handler calls:
- `revalidateTag("site-content:{tenantId}")`
- `revalidatePath("/")`
- `revalidatePath("/menu")`
- `revalidatePath("/contact")`

so the public pages pick up the change on their next render.

### Response 400 (validation)

```json
{
  "ok": false,
  "message": "Invalid input.",
  "errors": [
    { "path": "bookingCtaTarget", "message": "Must start with / or https://" }
  ]
}
```

### Response 401 / 403 / 500

```json
{ "ok": false, "message": "..." }
```
