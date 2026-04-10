# Quickstart: Booking Quote Form

**Feature**: 001-booking-quote-form
**Date**: 2026-04-09

## Validation Checklist

Use this to verify the feature works end-to-end after implementation.

### 1. Dev Server Running

```bash
npm run dev
```

Confirm `http://localhost:3000` loads without errors.

---

### 2. Form Renders at /contact

Navigate to `http://localhost:3000/contact`.

- [ ] Page loads with the quote form visible
- [ ] Event date field has today's date + 2 days as the minimum selectable date
- [ ] Clicking or tapping dates before the minimum is blocked
- [ ] Event Type renders as a dropdown with all 8 options
- [ ] Services section shows all 9 options with description text
- [ ] All required fields are labelled

---

### 3. Client-Side Validation

Try submitting the form without filling anything in.

- [ ] Date field error shown if empty or invalid
- [ ] Event Type error shown if not selected
- [ ] Services error shown if none checked
- [ ] Name, Email, Phone, Guests errors shown inline
- [ ] Form does NOT submit while errors are present

Try selecting a date in the past or within 48 hours.

- [ ] Browser prevents selection (via `min` attribute) OR form shows a clear error

---

### 4. Successful Submission (with Supabase configured)

Fill in all fields with valid data and submit.

- [ ] Submit button shows loading state during the request
- [ ] On success: form replaced with branded confirmation message
- [ ] "Submit another inquiry" button resets the form
- [ ] Admin panel at `http://localhost:3000/admin/quotes` shows the new quote with:
  - [ ] Correct name, email, event type (from dropdown — not free text)
  - [ ] Correct service selections
  - [ ] Status: `new`
- [ ] Contacts panel shows the upserted contact record

---

### 5. Email Notification (with Resend configured)

- [ ] Owner receives an email with all quote details within ~30 seconds of submission

---

### 6. Constitution Compliance Check

- [ ] `src/services/quote-service.ts` exists and contains all Supabase logic
- [ ] `src/services/email-service.ts` exists and contains all Resend logic
- [ ] `src/app/api/quote/route.ts` contains no direct `createClient` or `new Resend()` calls
- [ ] `src/components/sections/quote-form.tsx` contains no direct SDK imports

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM=noreply@thesocialspreadcart.com
QUOTE_NOTIFICATION_EMAIL=info@socialspreadcart.com
```
