# Implementation Plan: Public Signup & Tenant Onboarding

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)

## Summary

Ship self-serve tenant creation and a three-step onboarding wizard.
A signup Server Action creates the auth user, `tenants`, `tenant_users`
(`owner`), and `tenant_brand` rows atomically, then drops the user into
a wizard that writes business info, brand colors, and a logo. Until
`tenant_brand.onboarded_at` is set, `/admin` redirects to `/onboarding`.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5, Supabase Auth, Zod, services
  layer (Spec 004), BrandService (Spec 005), InvitationService /
  ActiveTenant cookie (Spec 006), uploadLogo (Spec 007), admin shell
  (Spec 008).
**Storage**: Supabase — one migration (`20260505_onboarding.sql`)
  adding `tenant_brand.onboarded_at`, a `prevent_tenant_without_owner`
  deferred constraint trigger, and a slug-reserved update if needed.
**Testing**: Vitest. New suite `tests/signup-flow.test.ts` covering
  happy path, slug collision, reserved slug, transactional rollback,
  resume-onboarding behavior.
**Target Platform**: Next.js full-stack app, Vercel.
**Constraints**: No billing. Wizard steps MUST persist incrementally so
  a mid-flow crash leaves good data. The signup action MUST be
  transactional.
**Scale/Scope**: 1 migration, 1 new signup page, 1 Server Action, 1
  wizard route group with 3 steps, ~2 marketing CTA updates.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Signup action does signup only; wizard steps each own one concern | ✅ |
| II. Open/Closed | Wizard can gain steps by adding routes; state derives from brand record | ✅ |
| IV. Interface Segregation | Wizard depends on BrandService + uploadLogo; no direct DB | ✅ |
| V. Dependency Inversion | All data access via services layer | ✅ |
| UX & Brand | Default brand from Spec 005 constant; new tenant looks branded from first paint | ✅ |
| Tech Stack | No new dependencies | ✅ |

## Project Structure

```text
supabase/migrations/
└── 20260505_onboarding.sql                # NEW: onboarded_at column + prevent_tenant_without_owner trigger

src/
├── services/
│   └── tenant-service.ts                   # UPDATED: createTenantFromSignup(), isSlugAvailable()
├── lib/
│   └── tenant/
│       └── slug-validation.ts              # UPDATED/NEW: shared reserved-slugs + regex validator
└── app/
    ├── (marketing)/
    │   └── signup/page.tsx                 # NEW (if hosted on app host) or link to external
    ├── (admin)/
    │   ├── admin/layout.tsx                # UPDATED: redirect to /onboarding if onboarded_at is null
    │   └── onboarding/
    │       ├── layout.tsx                  # NEW: wizard chrome
    │       ├── step-1/page.tsx             # NEW: business info
    │       ├── step-2/page.tsx             # NEW: brand colors
    │       ├── step-3/page.tsx             # NEW: logo upload
    │       └── actions.ts                  # NEW: Server Actions per step + finish
    ├── signup/
    │   ├── page.tsx                        # NEW: email/password/slug form
    │   └── actions.ts                      # NEW: createTenantFromSignup Server Action
    └── api/
        └── slug-available/route.ts         # NEW: cheap availability check
tests/
└── signup-flow.test.ts                     # NEW
```

## Implementation Order

1. Write `20260505_onboarding.sql`:
   - `alter table public.tenant_brand add column onboarded_at timestamptz`.
   - Create function `public.prevent_orphan_tenant()` and an `after
     insert` trigger on `tenants` that is deferred to end of transaction
     (or use a constraint trigger) and raises if no `tenant_users`
     owner exists for the new tenant.
2. Update `src/lib/tenant/slug-validation.ts` to export `isValidSlug`,
   `RESERVED_SLUGS`, and `isSlugAvailable(supabase, slug)` — all shared
   between the signup page, the signup Server Action, and the API
   availability route.
3. Add `TenantService.createTenantFromSignup({ userId, email, slug, displayName })`:
   - Wraps an RPC or Server Action transaction.
   - Inserts `tenants`, `tenant_users` (`owner`), and relies on the
     Spec 005 brand trigger for `tenant_brand` defaults.
   - Returns the new `tenantId`.
4. Write `src/app/signup/actions.ts` containing `createTenantFromSignup`:
   - Calls Supabase Auth `signUp`.
   - Calls `TenantService.createTenantFromSignup`.
   - Sets the active-tenant cookie.
   - Redirects to `/onboarding/step-1`.
   - Rolls back on any failure.
5. Write `src/app/signup/page.tsx` — client form with Zod validation,
   async slug availability check, friendly errors.
6. Write `src/app/api/slug-available/route.ts` — GET returning
   `{ available: boolean }`.
7. Build the wizard:
   - `src/app/(admin)/onboarding/layout.tsx` — progress indicator, step
     navigation, brand-aware chrome.
   - Step 1 page — form for display name, tagline, phone, email,
     hours. Saves via `BrandService.updateBrand`.
   - Step 2 page — color pickers with live preview. Rejects AA failures.
   - Step 3 page — logo upload via `uploadLogo()`; "Skip for now" button.
   - `actions.ts` — one Server Action per step plus a `finishOnboarding`
     action that sets `onboarded_at = now()` and redirects to `/admin`.
8. Update `src/app/(admin)/admin/layout.tsx`:
   - Call `BrandService.getBrand(currentTenantId)`.
   - If `onboarded_at` is null, redirect to the earliest incomplete
     wizard step.
9. Update the marketing CTA (`src/app/(marketing)/page.tsx` or the
   section component) so "Start your cart" links to
   `https://app.socialspreadcart.com/signup`.
10. Write `tests/signup-flow.test.ts`:
    - Happy path: signup → tenant exists → brand exists → wizard saves
      → onboarded_at set → admin renders.
    - Slug collision: second signup rejected.
    - Reserved slug: rejected.
    - Transactional rollback: simulate the `tenant_users` insert
      failing; assert the `tenants` row does not exist.
    - Resume flow: set brand fields partially, log in, expect redirect
      to the right step.
11. Run full `npm test`; confirm Specs 001, 002, 006, 008 suites still
    pass. Run the Spec 001 quickstart against the newly-created tenant
    to prove the end-to-end experience.
