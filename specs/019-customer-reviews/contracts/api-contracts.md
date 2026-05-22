# API Contracts: Customer Reviews And Floating CTA

## Public Review Submission

### POST `/api/reviews`

Creates a pending review for the current tenant.

Request body:

```json
{
  "displayName": "Avery M.",
  "rating": 5,
  "reviewText": "The dirty soda cart was the hit of our shower.",
  "occasion": "Baby shower",
  "customerEmail": "avery@example.com",
  "customerPhone": ""
}
```

Validation:

- `displayName`: required, trimmed, bounded.
- `rating`: required integer from 1 to 5.
- `reviewText`: required, trimmed, bounded.
- `occasion`: optional, trimmed, bounded.
- `customerEmail`: optional valid email.
- `customerPhone`: optional bounded text.

Success response:

```json
{
  "ok": true,
  "message": "Review submitted for approval."
}
```

Failure response:

```json
{
  "ok": false,
  "message": "Please complete the required review fields."
}
```

Rules:

- The route resolves the current tenant server-side.
- The created review is always pending.
- The response does not include private database details.

## Public Approved Reviews

### GET `/api/reviews`

Returns approved reviews for the current tenant when client-side refresh is needed. Server-rendered public pages may use the same service directly.

Success response:

```json
{
  "ok": true,
  "reviews": [
    {
      "id": "review-id",
      "displayName": "Avery M.",
      "rating": 5,
      "reviewText": "The dirty soda cart was the hit of our shower.",
      "occasion": "Baby shower",
      "approvedAt": "2026-05-22T18:00:00.000Z"
    }
  ]
}
```

Rules:

- Only approved reviews are returned.
- Private fields are never returned.
- The response is built from `ReviewService` or an explicit public-safe projection, not from unrestricted public access to the base reviews table.

## Admin Review List

### GET `/api/admin/reviews?status=pending`

Returns tenant-scoped reviews for admin moderation.

Success response:

```json
{
  "ok": true,
  "reviews": [
    {
      "id": "review-id",
      "displayName": "Avery M.",
      "rating": 5,
      "reviewText": "The dirty soda cart was the hit of our shower.",
      "occasion": "Baby shower",
      "customerEmail": "avery@example.com",
      "customerPhone": "",
      "status": "pending",
      "submittedAt": "2026-05-22T18:00:00.000Z",
      "adminNote": null
    }
  ]
}
```

Rules:

- Requires tenant admin authorization.
- Results are scoped to the admin's current tenant.
- `status` filter is optional and supports pending, approved, rejected, and hidden.

## Admin Review Status Update

### PATCH `/api/admin/reviews/{id}/status`

Moderates a review.

Request body:

```json
{
  "status": "approved",
  "adminNote": "Good public review."
}
```

Success response:

```json
{
  "ok": true
}
```

Failure response:

```json
{
  "ok": false,
  "message": "Invalid review moderation request."
}
```

Rules:

- Requires tenant admin authorization.
- Status transitions must be valid.
- Review must belong to the current tenant.
- Approval records the acting admin and approval timestamp.
- Rejection and hidden states record the acting admin and relevant timestamp.
