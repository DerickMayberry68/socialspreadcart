# Contract: About Content

## Admin Load

`GET /api/admin/site-content/about`

Returns the current tenant's editable About content bundle.

### Success Response

```json
{
  "ok": true,
  "content": {
    "tenant_id": "uuid",
    "eyebrow": "About The Brand",
    "title": "A hospitality brand built to feel polished...",
    "description": "The Social Spread Cart exists...",
    "story_badge": "Bentonville based",
    "story_title": "Thoughtful presentation...",
    "story_body": [
      "The Social Spread Cart was created...",
      "From take-home orders to full event setups..."
    ],
    "updated_at": "2026-04-22T00:00:00.000Z",
    "updated_by": "uuid-or-null"
  },
  "images": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "display_order": 1,
      "image_url": "/client/cart-umbrella-wide.jpg",
      "storage_path": null,
      "alt_text": "The Social Spread Cart setup ready for an event",
      "is_active": true,
      "created_at": "2026-04-22T00:00:00.000Z",
      "updated_at": "2026-04-22T00:00:00.000Z",
      "updated_by": "uuid-or-null"
    }
  ],
  "featureCards": [
    {
      "tenant_id": "uuid",
      "display_order": 1,
      "title": "Approachable service",
      "body": "The experience should feel easy...",
      "icon_key": "heart-handshake",
      "updated_at": "2026-04-22T00:00:00.000Z",
      "updated_by": "uuid-or-null"
    }
  ]
}
```

### Failure Responses

- `401`: User is not signed in.
- `403`: User is signed in but does not administer the current tenant.
- `500`: Content could not be loaded.

All failures return JSON:

```json
{
  "ok": false,
  "message": "Failed to load About content."
}
```

## Admin Save

`PATCH /api/admin/site-content/about`

Publishes the current tenant's About page content immediately.

### Request Body

```json
{
  "content": {
    "eyebrow": "About The Brand",
    "title": "A hospitality brand built to feel polished, cheerful, and easy to welcome into the room.",
    "description": "The Social Spread Cart exists for hosts...",
    "story_badge": "Bentonville based",
    "story_title": "Thoughtful presentation, warm hospitality...",
    "story_body": [
      "The Social Spread Cart was created for hosts...",
      "From take-home orders to full event setups...",
      "We serve Bentonville and nearby Northwest Arkansas communities..."
    ]
  },
  "images": [
    {
      "id": "uuid-or-temp-id",
      "display_order": 1,
      "image_url": "/client/cart-umbrella-wide.jpg",
      "storage_path": null,
      "alt_text": "The Social Spread Cart setup ready for an event",
      "is_active": true
    }
  ],
  "featureCards": [
    {
      "display_order": 1,
      "title": "Approachable service",
      "body": "The experience should feel easy for the host and welcoming for every guest.",
      "icon_key": "heart-handshake"
    },
    {
      "display_order": 2,
      "title": "Playful polish",
      "body": "The brand mixes premium presentation with bright, celebratory energy.",
      "icon_key": "sparkles"
    },
    {
      "display_order": 3,
      "title": "Locally rooted",
      "body": "Built for Bentonville and the wider Northwest Arkansas event scene.",
      "icon_key": "map-pin"
    }
  ]
}
```

### Success Response

Returns the canonical saved bundle in the same shape as Admin Load.

### Validation Failure

`400`

```json
{
  "ok": false,
  "message": "Story title is required."
}
```

## Public Loader

`SiteContentService.loadAboutPageContent(tenantId)`

Returns:

```ts
{
  content: AboutPageContent;
  images: AboutImage[];
  featureCards: [AboutFeatureCard, AboutFeatureCard, AboutFeatureCard];
}
```

Rules:
- Always returns a complete bundle.
- Uses fallback content if tenant rows are missing or Supabase is unavailable.
- Public page renders only active images sorted by display order.
