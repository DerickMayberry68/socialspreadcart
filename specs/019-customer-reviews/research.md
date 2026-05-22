# Research: Customer Reviews And Floating CTA

## Decision: Create a new customer reviews domain

**Decision**: Add a new tenant-scoped review model instead of expanding the existing `testimonials` table.

**Rationale**: Existing testimonials are simple public quote rows with no moderation state or private submission metadata. Customer-submitted reviews require pending/approved/rejected/hidden statuses, optional private contact fields, source tracking, and admin moderation metadata. A separate domain keeps the existing testimonial carousel stable and avoids exposing private submission fields through a public-read table.

**Alternatives considered**:

- Extend `testimonials`: rejected because the table is public-readable today and lacks moderation/privacy semantics.
- Store reviews in `marketing_page_content`: rejected because reviews are user-generated operational records, not admin-authored page copy.

## Decision: Moderate reviews before publication

**Decision**: New reviews default to `pending`; public pages display only `approved` reviews.

**Rationale**: Public submission can attract spam, private information, or off-brand text. Moderation keeps the site trustworthy and satisfies the requirement that customers can add reviews without immediately publishing unreviewed content.

**Alternatives considered**:

- Auto-publish all submissions: rejected due to spam/privacy risk.
- Require login to submit: rejected because public customers and guests need a low-friction path.

## Decision: Public submission through app route and service layer

**Decision**: Use a public app route for review submission that resolves the current tenant and calls `ReviewService`.

**Rationale**: The constitution requires data access through services. A route boundary allows server-side validation, tenant resolution, rate/spam guard hooks, private field normalization, and handled responses without exposing the database client in UI components.

**Alternatives considered**:

- Direct browser writes to Supabase: rejected because it would push tenant resolution and abuse controls into the client.
- Server Action only: acceptable, but route contract is easier to test consistently with existing public quote/order API patterns.

## Decision: RLS with server-side public-safe projection

**Decision**: Enable RLS on the reviews table. Do not expose broad public reads on the base table. Public display should come from `ReviewService` through server-side routes/pages or an explicit public-safe projection that includes only approved rows and display-safe columns. Public submissions should go through the intended application route or be protected by restrictive insert policies, and tenant-admin moderation must use tenant-scoped policies.

**Rationale**: Supabase guidance for public schema tables is to enable RLS and create policies for allowed operations. The app already uses tenant-scoped policies through `admin_tenant_ids_for_current_user()` and public-read policies for marketing records.

**Alternatives considered**:

- Table without RLS: rejected as unsafe for public schema.
- Public read of the base review table: rejected because pending/rejected rows and private fields must not leak.

## Decision: Keep Contact page, remove only header navigation item

**Decision**: Remove Contact from the public header navigation, but keep `/contact`, quote form links, footer details, and Book The Cart pathways.

**Rationale**: The user asked to remove the Contact menu option, not the contact workflow. The existing quote and booking paths are still necessary for conversion and support.

**Alternatives considered**:

- Delete Contact page: rejected because it would break CTAs, quote form, footer pathways, and existing SEO routes.
- Hide all contact links: rejected because booking/contact must remain available.

## Decision: Stack the new review floating action above Book The Cart

**Decision**: Extend `FloatingCta` into a stacked floating action group with "Leave a Review" above "Book The Cart".

**Rationale**: This preserves the current booking CTA and creates a site-wide review entry point without crowding the header. The component already centralizes the floating action behavior across public pages.

**Alternatives considered**:

- Add review link to header navigation: rejected because the request specifically removes a header item and asks for a floating button.
- Put review link only inside reviews section: rejected because the review entry point should be accessible from any public page.
