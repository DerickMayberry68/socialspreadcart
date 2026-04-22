# Contract: Gallery Content

## Scope

Admin and public contracts for loading and saving gallery section copy plus ordered gallery images.

## Public Loader

### Operation

`SiteContentService.loadGalleryPageContent(tenantId)`

### Response

```ts
type GalleryPageContent = {
  section: {
    tenant_id: string;
    eyebrow: string;
    title: string;
    description: string;
    feature_card_eyebrow: string;
    feature_card_title: string;
    support_card_body: string;
    updated_at: string;
    updated_by: string | null;
  };
  images: Array<{
    id: string;
    tenant_id: string;
    display_order: number;
    title: string;
    eyebrow: string;
    alt_text: string;
    image_url: string;
    storage_path: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    updated_by: string | null;
  }>;
};
```

### Behavior

- Returns fallback section copy when no saved section row exists.
- Returns fallback image rows for first-time tenants with no saved gallery state.
- Returns an empty image array when the tenant explicitly saved a zero-image gallery.
- Sorts images by `display_order` ascending.
- Does not expose another tenant's gallery content.

## Admin GET

### Route

`GET /api/admin/site-content/gallery`

### Authorization

- Must require current tenant admin access before loading content.

### Success Response

```json
{
  "ok": true,
  "section": {
    "tenant_id": "uuid",
    "eyebrow": "Gallery",
    "title": "A visual library...",
    "description": "This page...",
    "feature_card_eyebrow": "What the gallery should do",
    "feature_card_title": "Make the product feel real...",
    "support_card_body": "The goal is not just...",
    "updated_at": "2026-04-22T00:00:00.000Z",
    "updated_by": null
  },
  "images": [
    {
      "id": "uuid-or-stable-default-id",
      "tenant_id": "uuid",
      "display_order": 1,
      "title": "Dirty soda service from the cart",
      "eyebrow": "Cart Service",
      "alt_text": "Dirty soda service from the cart",
      "image_url": "/client/cart-dirty-soda-hero.jpg",
      "storage_path": null,
      "is_active": true,
      "created_at": "2026-04-22T00:00:00.000Z",
      "updated_at": "2026-04-22T00:00:00.000Z",
      "updated_by": null
    }
  ]
}
```

### Error Responses

- `401` when no authenticated admin session exists.
- `403` when authenticated user does not administer the current tenant.

## Admin PATCH

### Route

`PATCH /api/admin/site-content/gallery`

### Authorization

- Must require current tenant admin access before reading or saving the body.

### Request Body

```json
{
  "section": {
    "eyebrow": "Gallery",
    "title": "A visual library of real cart service, drinks, grazing, and event-ready moments.",
    "description": "This page leans on actual client photography...",
    "feature_card_eyebrow": "What the gallery should do",
    "feature_card_title": "Make the product feel real, the events feel joyful, and the brand feel worth trusting.",
    "support_card_body": "The goal is not just to show pretty images..."
  },
  "images": [
    {
      "id": "optional-existing-id",
      "display_order": 1,
      "title": "Dirty soda service from the cart",
      "eyebrow": "Cart Service",
      "alt_text": "Dirty soda service from the cart",
      "image_url": "https://public-image-url",
      "storage_path": "tenant-id/gallery/file.jpg",
      "is_active": true
    }
  ]
}
```

### Validation

- `section.title`: required, 1-180 characters.
- `section.description`: required, 1-500 characters.
- `section.feature_card_title`: required, 1-220 characters.
- `section.support_card_body`: required, 1-320 characters.
- `images`: array may be empty.
- Each image must include `title`, `alt_text`, `image_url`, and `display_order`.
- Each image title must be 1-140 characters.
- Each image alt text must be 1-180 characters.
- Image order must be normalized before persistence.

### Success Response

```json
{
  "ok": true,
  "section": {},
  "images": []
}
```

The success response returns the saved section and saved ordered image list using the same shape as the admin GET response.

### Error Responses

- `400` for invalid fields, invalid JSON, or invalid image data.
- `401` when no authenticated admin session exists.
- `403` when authenticated user does not administer the current tenant.
- `500` when content cannot be saved due to system configuration or persistence failure.

## Cache Contract

Successful saves must revalidate:

- `site-content:{tenantId}`
- the public gallery page path

The last published gallery content must remain visible when a save fails.
