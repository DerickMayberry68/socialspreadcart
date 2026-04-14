# Feature Specification: Public Signup & Tenant Onboarding

**Feature Branch**: `009-public-signup-tenant-onboarding`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Let new cart operators sign themselves up from the marketing site. A signup creates the user, a new tenant, a tenant_users row with role=owner, a default brand record, and drops the user into a short onboarding wizard that collects business name, slug, palette, and primary logo."

## Context

Specs 002–008 build everything needed to run multi-tenant — schema, RLS,
routing, services, brand, auth, storage, admin shell — but every tenant
still has to be created by hand in the database. This feature closes
the loop: a prospect lands on the marketing site, clicks "Start your
cart", and ends up with a working admin dashboard under their own
subdomain in under five minutes.

The flow is: Supabase Auth signup → tenant creation Server Action →
`tenant_users` insert with `role = 'owner'` → default `tenant_brand` row
(auto-created by the Spec 005 trigger) → redirect into a 3-step
onboarding wizard on the admin host. The wizard writes to `tenant_brand`
and optionally uploads a logo via the Spec 007 `logos` bucket.

This feature explicitly does NOT handle billing. Sign-up is free for the
trial phase; a paid plan gate is a separate future spec.

## User Scenarios & Testing

### User Story 1 — Prospect Signs Up And Gets A Tenant (Priority: P1)

An unauthenticated visitor on the marketing site clicks "Start your
cart", enters an email and password (Supabase Auth), picks a slug, and
submits. The server creates the auth user, a `tenants` row with that
slug, a `tenant_users` row with `role = 'owner'`, and the default
`tenant_brand` record. The visitor is redirected to the onboarding
wizard at `app.socialspreadcart.com/onboarding`.

**Why this priority**: This is the whole point of the feature. Without
self-serve signup, there is no growth loop.

**Independent Test**: From the marketing site, sign up as
`new-owner@test.local` with slug `example-cart`. Confirm the
`tenants`, `tenant_users`, and `tenant_brand` rows exist and that the
user lands on `/onboarding`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they submit the signup
   form with email, password, and an available slug, **Then** a new
   tenant is created, the user is linked as owner, and they are
   redirected to the onboarding wizard.
2. **Given** a signup attempt with a slug that is already taken,
   **When** the form submits, **Then** the server returns a validation
   error on the slug field and no tenant is created.
3. **Given** a signup attempt with a reserved slug (`www`, `app`,
   `api`, etc.), **When** the form submits, **Then** the server rejects
   the slug with a clear message.

---

### User Story 2 — Onboarding Wizard Captures Brand Basics (Priority: P1)

After signup, the user sees a 3-step wizard:
1. **Business**: display name, tagline, phone, email, hours.
2. **Brand**: primary color, accent color, background color, text color.
3. **Logo**: upload a horizontal logo to the `logos` bucket (Spec 007)
   or skip.

Each step saves incrementally to `tenant_brand` via `BrandService`. On
completion, the user is redirected to `/admin` with their tenant live.

**Why this priority**: Without the wizard, the default brand values
ship as-is and every new tenant's site looks like SocialSpreadCart.

**Independent Test**: Complete the wizard as a new tenant. Visit
`<slug>.socialspreadcart.com`. Confirm the entered display name appears
in the header and the chosen primary color is used for buttons.

**Acceptance Scenarios**:

1. **Given** a user on step 1, **When** they submit valid business
   info, **Then** the values are saved and step 2 opens.
2. **Given** a user on step 2, **When** they pick colors that fail AA
   contrast (Spec 005 edge case), **Then** the form returns a
   validation error.
3. **Given** a user on step 3, **When** they upload a logo, **Then**
   the file lands at `tenants/<id>/logos/horizontal.svg` (Spec 007) and
   `tenant_brand.logo_horizontal_url` is set.
4. **Given** a user completes or skips all steps, **When** the wizard
   finishes, **Then** they are redirected to `/admin`.

---

### User Story 3 — New Tenant Appears On Their Subdomain Immediately (Priority: P2)

The moment a tenant row exists with `status = 'active'`, requests to
`<slug>.socialspreadcart.com` resolve to that tenant (Spec 003). The
public site renders with default brand tokens until the wizard
overrides them; as the wizard saves, subsequent page loads reflect the
new values.

**Why this priority**: Proof that everything wires up end-to-end and a
satisfying moment for the new owner.

**Independent Test**: Immediately after signup, open
`<slug>.socialspreadcart.com` in an incognito tab. Confirm the home
page renders. Run the wizard in another tab. Refresh the incognito tab.
Confirm the new brand values appear.

**Acceptance Scenarios**:

1. **Given** a tenant was just created by the signup action, **When** a
   visitor loads `<slug>.socialspreadcart.com`, **Then** the home page
   renders with default brand tokens.
2. **Given** the wizard has saved step 2, **When** the visitor refreshes,
   **Then** the updated colors are applied.

---

### User Story 4 — Onboarding Can Be Resumed (Priority: P3)

If a user abandons the wizard mid-flow and logs back in later, they are
returned to the step they left off. The `tenant_brand` record's
`onboarded_at` column is set when the wizard finishes; while it is
null, the admin layout redirects `/admin` → `/onboarding`.

**Why this priority**: A nice polish but not blocking V1.

**Independent Test**: Sign up, complete step 1, close the tab. Log in
again. Confirm the wizard opens on step 2.

**Acceptance Scenarios**:

1. **Given** a tenant with `onboarded_at IS NULL` and step 1 complete,
   **When** the user visits `/admin`, **Then** they are redirected to
   `/onboarding/step-2`.
2. **Given** a tenant with `onboarded_at` set, **When** the user visits
   `/onboarding`, **Then** they are redirected to `/admin`.

---

### Edge Cases

- **Slug collision race**: two people submit the same slug within
  milliseconds. The DB unique constraint on `tenants.slug` is the source
  of truth; the second caller gets a friendly retry error.
- **Signup while already logged in**: detected; redirected to
  `/choose-tenant` (Spec 006) or `/admin`.
- **Email already has an account**: the signup form detects this
  client-side when possible and offers a "sign in instead" link. If not
  caught client-side, the server returns a clean error.
- **Abandoned signups with no `tenant_users` row**: never happens —
  the Server Action is transactional. If the `tenant_users` insert
  fails, the `tenants` insert is rolled back.
- **Brand validation failure mid-wizard**: step 2 rejects, step 1 data
  is already saved, user can retry step 2 without re-entering business
  info.
- **Billing / plan gate**: out of scope. Assume every new tenant is
  free-tier until a future spec introduces plans.
- **Email verification**: Supabase Auth handles this per project
  config. If verification is required, the wizard gates access until
  the email is verified; otherwise it runs immediately.

## Requirements

### Functional Requirements

- **FR-001**: A `/signup` page MUST exist on
  `app.socialspreadcart.com` with fields: `email`, `password`,
  `display_name`, `slug`.
- **FR-002**: A `createTenantFromSignup` Server Action MUST:
  1. Call Supabase Auth `signUp`.
  2. Within a single transaction, insert a `tenants` row, a
     `tenant_users` row with `role = 'owner'`, and a `tenant_brand` row
     (or rely on the Spec 005 trigger).
  3. Set the active-tenant cookie (Spec 006).
  4. Return a redirect to `/onboarding/step-1`.
- **FR-003**: Slug validation MUST reject reserved slugs (Spec 003) and
  must match the same regex used in `tenants.slug CHECK`.
- **FR-004**: The onboarding wizard MUST be three steps: business info,
  brand colors, optional logo upload.
- **FR-005**: Each wizard step MUST save incrementally via
  `BrandService.updateBrand()` so a partial flow leaves good data.
- **FR-006**: A new column `tenant_brand.onboarded_at timestamptz` MUST
  be added and set by the final wizard step.
- **FR-007**: The admin layout MUST redirect to `/onboarding` when the
  current tenant has `onboarded_at IS NULL`.
- **FR-008**: The wizard's logo upload MUST go through the
  `uploadLogo()` service from Spec 007.
- **FR-009**: The `createTenantFromSignup` action MUST be idempotent
  against the failure mode of "tenant created but auth user failed to
  persist" — it MUST detect and recover or fail cleanly.
- **FR-010**: The marketing site CTA "Start your cart" MUST link to
  `https://app.socialspreadcart.com/signup`.
- **FR-011**: A DB constraint MUST prevent a `tenants` row from existing
  without at least one `tenant_users` owner (enforced by a deferred
  trigger or by the Server Action only; the spec prefers the trigger
  for defense in depth).

### Key Entities

- **SignupSubmission**: email, password, display_name, slug. Ephemeral,
  not stored.
- **OnboardingState**: derived from `tenant_brand.onboarded_at` and
  which brand fields are populated; no separate table.

## Success Criteria

- **SC-001**: A new prospect can go from marketing-site landing to a
  live, branded tenant at `<slug>.socialspreadcart.com` in under five
  minutes.
- **SC-002**: 100% of signups result in a complete triple of
  `(tenants, tenant_users, tenant_brand)` rows — zero partial states.
- **SC-003**: Reserved slugs (`app`, `www`, `api`, `admin`, `auth`,
  `static`, `assets`, `cdn`) are rejected with a clear error.
- **SC-004**: An abandoned wizard resumes at the correct step on next
  login.
- **SC-005**: Signup and onboarding together generate zero errors in
  server logs during the E2E quickstart.

## Assumptions

- Billing is out of scope. Every new tenant is free-tier.
- Email verification behavior is controlled by Supabase Auth project
  settings; the wizard honors whatever is configured.
- The marketing site lives at `www.socialspreadcart.com` and is either
  a separate static site or a route group in this repo. Either way, its
  CTA target is fixed.
- The onboarding wizard is tenant-scoped to the just-created tenant;
  there is no multi-tenant chooser mid-wizard.
- The slug-availability check in the signup form is a live server
  validation via a throwaway `GET /api/slug-available?slug=...` route
  (or a Server Action fetch) to prevent bad UX on collision.
- Brand defaults come from `src/lib/tenant/default-brand.ts` (Spec 005).
  A new tenant's brand record is populated from that constant via the
  trigger; the wizard overrides fields as the user chooses them.
