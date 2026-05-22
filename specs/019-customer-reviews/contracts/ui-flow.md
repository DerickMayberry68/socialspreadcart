# UI Flow: Customer Reviews And Floating CTA

## Visitor Flow: Leave A Review

1. Visitor lands on any public marketing page.
2. Visitor sees two floating actions:
   - Leave a Review
   - Book The Cart
3. Visitor selects Leave a Review.
4. Review form opens or navigates to a review submission section without removing access to booking.
5. Visitor enters display name, rating, review text, and optional occasion/contact details.
6. Visitor submits.
7. Valid submission shows a handled success state explaining the review will be reviewed before publication.
8. Invalid submission shows field-level errors and preserves entered text.

## Visitor Flow: Read Reviews

1. Visitor reaches the public reviews section.
2. If approved reviews exist, cards show rating, display name, occasion, and review text.
3. If no approved reviews exist, the page either hides the section or shows polished encouragement to leave the first review.
4. Visitor can still select Book The Cart from the existing floating action.

## Admin Flow: Moderate Reviews

1. Tenant admin opens Reviews from the admin shell.
2. Admin sees pending reviews first, with filters for approved, rejected, and hidden.
3. Admin can approve, reject, hide, or restore a review.
4. Admin can add or update a private note.
5. Approved reviews become visible on the public site.
6. Rejected/hidden reviews remain unavailable publicly.

## Public Header Navigation

Expected public navigation after this feature:

- Home
- Menu
- The Cart
- Events
- Gallery
- About

Rules:

- Contact is removed from the header menu.
- Footer contact details remain.
- CTA links to `/contact` remain allowed.
- Direct `/contact` route remains available.

## Floating Action Layout

Desktop:

```text
bottom right
| Leave a Review |
| Book the Cart  |
```

Mobile:

```text
bottom right, stacked, no overlap with viewport edges
| Leave a Review |
| Book the Cart  |
```

Rules:

- Leave a Review appears above Book The Cart.
- Buttons use the site's existing rounded, premium CTA language.
- Buttons must not overlap mobile navigation, dialogs, or footer content.
- If a dialog/form is open, focus and scroll behavior must remain predictable.
