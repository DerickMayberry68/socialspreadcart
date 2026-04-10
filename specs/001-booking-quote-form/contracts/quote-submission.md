# Contract: Quote Submission API

**Endpoint**: `POST /api/quote`
**Feature**: 001-booking-quote-form
**Date**: 2026-04-09

## Overview

Public endpoint. No authentication required. Accepts a structured quote request,
persists it via the quote service, and triggers an owner notification email.

---

## Request

**Content-Type**: `application/json`

### Body Schema

```typescript
{
  name: string;          // min 2 chars
  email: string;         // valid email
  phone: string;         // min 7 chars
  eventDate: string;     // "yyyy-MM-dd"; must be >= today + 2 days
  eventType: EventType;  // one of the 8 defined event types (see data-model.md)
  guests: string;        // non-empty
  services: ServiceOption[]; // min 1 item; each must be a valid ServiceOption
  message?: string;      // optional
}
```

### Example Request Body

```json
{
  "name": "Sarah Mitchell",
  "email": "sarah@example.com",
  "phone": "4795551234",
  "eventDate": "2026-05-15",
  "eventType": "Wedding",
  "guests": "75",
  "services": ["Charcuterie Cart", "Dirty Soda Cart"],
  "message": "Outdoor ceremony at Compton Gardens. Need setup by 5pm."
}
```

---

## Response

### 200 OK — Success

```json
{
  "ok": true,
  "message": "Quote submitted."
}
```

### 400 Bad Request — Validation Failure

Returned when the request body fails Zod schema validation.

```json
{
  "ok": false,
  "message": "Please complete all required fields."
}
```

### 500 Internal Server Error — Server Failure

Returned when the database write or contact upsert fails.

```json
{
  "ok": false,
  "message": "<error detail>"
}
```

---

## Side Effects (in order)

1. **Upsert Contact** — create or update a Contact record keyed on `email` (lowercased).
2. **Insert Quote** — create a new Quote record linked to the Contact, status `new`.
3. **Log Interaction** — append a `quote_submitted` Interaction on the Contact timeline.
4. **Send Email** — dispatch a notification email to the owner via the email service.

All steps 1–3 are handled by `QuoteService.submitQuote()`.
Step 4 is handled by `EmailService.sendQuoteNotification()`.

The route handler orchestrates these two service calls. It MUST NOT contain
direct Supabase or Resend SDK calls.

---

## Validation Rules (enforced by Zod in `QuoteService`)

| Field | Rule |
|-------|------|
| name | min 2 characters |
| email | valid RFC email format |
| phone | min 7 characters |
| eventDate | valid date; >= today + 48 hours |
| eventType | must be one of the 8 EventType values |
| guests | non-empty string |
| services | array, min 1 item; each item must be a ServiceOption |
| message | optional; no length constraint |

---

## Notes

- The endpoint is idempotent for the same email + different event dates
  (each submission creates a new Quote, but upserts the same Contact).
- Double-submission protection is a client-side responsibility (disable button
  on submit); the server does not deduplicate identical payloads.
- The endpoint does not return the created quote ID to the client (not needed
  for the confirmation UX).
