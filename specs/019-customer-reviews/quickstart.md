# Quickstart: Customer Reviews And Floating CTA

## Stakeholder Review Checklist

- Customers can leave a review without creating an account.
- New reviews are pending by default and not visible publicly.
- Shayley can approve, reject, hide, and restore reviews from admin.
- Approved reviews appear publicly in a polished site section.
- Customer email/phone are never displayed publicly.
- Contact is removed from the header navigation only.
- `/contact`, quote form, footer contact details, and booking CTAs still work.
- Floating actions show Leave a Review above Book The Cart on desktop and mobile.

## Implementation Validation

Run these after implementation:

```powershell
npm test
npx tsc --noEmit
```

If database schema changes are implemented, also verify the linked/local schema and RLS behavior:

```powershell
supabase db query --linked "select status, count(*) from public.customer_reviews group by status;"
```

## Manual Acceptance Paths

### Public Submission

1. Open the public home page.
2. Select Leave a Review.
3. Submit a valid review.
4. Confirm the success message says the review is awaiting approval.
5. Confirm the review does not immediately appear publicly.

### Admin Moderation

1. Sign in as a tenant admin.
2. Open Reviews in the admin shell.
3. Approve the pending review.
4. Refresh the public reviews section.
5. Confirm the approved review appears.

### Rejection/Hidden States

1. Submit another review.
2. Reject it from admin.
3. Confirm it never appears publicly.
4. Hide an approved review.
5. Confirm it disappears publicly.

### Navigation And Floating Actions

1. Confirm Contact is absent from the public header on desktop and mobile.
2. Confirm footer contact details still show.
3. Confirm existing Book The Cart floating action still works.
4. Confirm Leave a Review appears above Book The Cart without overlap.

## Out Of Scope For V1

- Third-party review imports.
- Review photos or attachments.
- Automated email/SMS review requests.
- Coupons or incentives.
- Public review editing after submission.
- Automated sentiment or profanity vendor integration.
