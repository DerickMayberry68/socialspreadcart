# Data Model: Customer Reviews And Floating CTA

## New Entity: Customer Review

Represents a tenant-scoped review submitted by a public visitor and moderated by a tenant admin.

Fields:

- `id`: stable unique identifier.
- `tenant_id`: tenant that owns the review.
- `display_name`: public name shown with approved review.
- `rating`: integer rating from 1 to 5.
- `review_text`: customer review body.
- `occasion`: optional event/service context, such as shower, pop-up, pickup, cart service, dirty soda, or charcuterie.
- `customer_email`: optional private email for follow-up; never shown publicly.
- `customer_phone`: optional private phone for follow-up; never shown publicly.
- `status`: moderation state.
- `source`: submission source, such as floating CTA or admin-entered.
- `admin_note`: optional private moderation note.
- `submitted_at`: timestamp for public submission.
- `approved_at`: timestamp when status becomes approved.
- `approved_by`: tenant admin user id for approval.
- `rejected_at`: timestamp when status becomes rejected.
- `rejected_by`: tenant admin user id for rejection.
- `hidden_at`: timestamp when an approved review is hidden.
- `hidden_by`: tenant admin user id for hide action.
- `created_at`: creation timestamp.
- `updated_at`: last update timestamp.

Validation rules:

- `tenant_id`, `display_name`, `rating`, `review_text`, `status`, `submitted_at`, and timestamps are required.
- `display_name` must be short enough for card display and cannot be blank after trimming.
- `rating` must be an integer from 1 to 5.
- `review_text` must have a minimum useful length and a maximum bounded length.
- `customer_email`, if provided, must be a valid email and private.
- `customer_phone`, if provided, must be bounded and private.
- Public display must use only approved rows and display-safe fields.
- Tenant admins can only moderate rows for their tenant.

## Review Status Values

- `pending`: submitted and waiting for admin review. Default for public submissions.
- `approved`: visible in public review displays.
- `rejected`: reviewed and not eligible for public display.
- `hidden`: previously approved or admin-entered review intentionally hidden from public display.

## State Transitions

```text
public submit -> pending
admin create -> pending or approved

pending -> approved
pending -> rejected
pending -> hidden

approved -> hidden
hidden -> approved

rejected -> pending
rejected -> hidden
```

Rules:

- Public visitors can only create pending reviews.
- Public visitors cannot approve, reject, hide, restore, or list pending/rejected/hidden reviews.
- Approved reviews can be hidden without deleting historical moderation metadata.
- Rejected reviews can be reopened to pending if an admin wants to reconsider.

## Public Review Projection

The public site should render reviews through `ReviewService` or an explicit public-safe projection. That projection should include only approved rows and these fields:

- `id`
- `display_name`
- `rating`
- `review_text`
- `occasion`
- `approved_at` or a display-friendly date if needed

The public site must not render:

- `customer_email`
- `customer_phone`
- `admin_note`
- `submitted_at` for pending/rejected rows
- `approved_by`, `rejected_by`, `hidden_by`
- tenant internals beyond what is already public

## Public Navigation

Represents the shared header navigation values already managed through shell content.

Rules:

- Contact must be removed from public header navigation defaults and saved shell content.
- `/contact` remains a valid page.
- Existing CTA targets that point to `/contact` remain allowed.

## Floating Action Group

Represents the public floating action area.

Items:

- Leave a Review: opens or links to review submission.
- Book The Cart: preserves existing booking path.

Rules:

- Actions stack vertically with Leave a Review above Book The Cart.
- Actions must remain visible and non-overlapping on mobile and desktop.
- If review submission is unavailable, Book The Cart remains usable.
