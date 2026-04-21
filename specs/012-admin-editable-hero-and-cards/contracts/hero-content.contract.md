# Contract: Hero Content

**Feature**: 012-admin-editable-hero-and-cards
**Resource**: `/api/admin/site-content/hero`

Auth: admin/owner role in the current tenant. Unauthenticated → 401.
Non-admin → 403. Content-type: `application/json`.

---

## GET

Load the current tenant's hero content. Always returns a record
(seeded via trigger or migration).

### Response 200

```json
{
  "ok": true,
  "data": {
    "headline": "An elevated approach to hosting, designed to be experienced.",
    "subLine": "Snacks & sips, served your way.",
    "body": "The Social Spread is a luxury mobile cart bringing curated bites and signature sips directly to your event so you can host effortlessly and leave a lasting impression.",
    "primaryCtaLabel": "Start Your Order",
    "primaryCtaTarget": "/contact",
    "secondaryCtaLabel": "Browse the Menu",
    "secondaryCtaTarget": "/menu",
    "updatedAt": "2026-04-21T12:34:56.000Z"
  }
}
```

---

## PATCH

Upsert the hero content for the current tenant. Partial updates
supported.

### Request body

```json
{
  "headline": "...",
  "subLine": "",
  "body": "...",
  "primaryCtaLabel": "Book The Social Spread",
  "primaryCtaTarget": "/contact",
  "secondaryCtaLabel": "",
  "secondaryCtaTarget": ""
}
```

### Validation rules

| Field | Rule |
|-------|------|
| `headline` | 1–120 chars |
| `subLine` | 0–80 chars |
| `body` | 1–400 chars |
| `primaryCtaLabel` | 0–32 chars |
| `primaryCtaTarget` | 0–2048; if non-empty, must be `/...` or `https://...` |
| `secondaryCtaLabel` | 0–32 chars |
| `secondaryCtaTarget` | Same rule as primary |

**Coherence rule** (service layer): a CTA with a non-empty target
but an empty label is rejected with
`"Provide a CTA label or clear the target."`. An empty label alone
is valid — it simply hides that button on the public site
(FR-012).

### Response 200

```json
{ "ok": true, "data": { "...full record..." } }
```

On success calls `revalidateTag("site-content:{tenantId}")` and
`revalidatePath("/")`.

### Response 400

```json
{
  "ok": false,
  "message": "Invalid input.",
  "errors": [
    { "path": "headline", "message": "Headline must be 1–120 characters." }
  ]
}
```

### Response 401 / 403 / 500

```json
{ "ok": false, "message": "..." }
```
