# Implementation Plan: Customer Reviews And Floating CTA

**Branch**: `019-customer-reviews` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/019-customer-reviews/spec.md`

## Summary

Add a tenant-scoped customer reviews workflow that lets public visitors submit reviews from a new floating action, keeps submitted reviews pending until tenant admin moderation, displays only approved reviews on the public marketing site, removes Contact from the public header navigation, and preserves the existing Contact page, quote form, footer contact details, and Book The Cart floating action.

The technical approach is to add a dedicated reviews domain instead of overloading the existing testimonials table. Reviews will use a new tenant-scoped persistence model, service-layer access through `src/services/`, Zod validation at boundaries, public submission/display routes, admin moderation routes/pages, and RLS policies that avoid public reads on the raw private-field table. The existing `FloatingCta`, shared shell navigation, home testimonials area, and admin shell navigation will be extended rather than replaced.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router  
**Primary Dependencies**: Next.js Server Components/API routes, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Framer Motion  
**Storage**: Supabase Postgres; new tenant-scoped customer reviews table with RLS and moderation fields  
**Testing**: Vitest, Testing Library, `npm test`, `npx tsc --noEmit`; focused service, API route, tenant-isolation, and component tests  
**Target Platform**: Public Next.js marketing site plus protected tenant admin workspace  
**Project Type**: Web application with server-rendered public pages, client form interactions, API routes, services layer, and Supabase persistence  
**Performance Goals**: Public pages render approved reviews in under 2 seconds during normal operation; review submission returns confirmation in under 3 seconds; admin review list opens in under 2 seconds for typical tenant volume  
**Constraints**: Public visitors can submit without authentication; submitted reviews are not publicly visible until approved; all review data must remain tenant-scoped; public display must not expose email, phone, IP, user agent, moderation notes, or admin metadata; no component/page may call Supabase directly; no `window.alert`, `window.confirm`, or `window.prompt`; existing Book The Cart path remains available  
**Scale/Scope**: Version 1 supports one customer-facing submission path, approved public display, admin list/detail moderation, Contact nav removal, and stacked floating actions. Review images, third-party review imports, automated email solicitations, coupons, rich media, public review editing, and automated profanity/spam vendors are out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Responsibility**: PASS. Review persistence/moderation belongs in a `ReviewService`; UI components only render forms/lists/actions.
- **Open/Closed**: PASS. Existing testimonials, shell navigation, and floating CTA are extended by composition or narrow changes rather than replaced wholesale.
- **Liskov Substitution**: PASS. Existing testimonial display behavior remains intact until deliberately integrated with approved reviews; new review types are explicit.
- **Interface Segregation**: PASS. Public submission, public display, and admin moderation contracts are separate.
- **Dependency Inversion**: PASS. Supabase access remains behind services and route handlers depend on service abstractions.
- **UX & Brand Standards**: PASS. Review UI will reuse current card/button/input patterns and handled validation states.
- **Testing/Verification**: PASS. Plan includes tenant isolation, moderation visibility, route contract, component, and manual responsive checks.

## Project Structure

### Documentation (this feature)

```text
specs/019-customer-reviews/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- api-contracts.md
|   `-- ui-flow.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (site)/
|   |   |-- page.tsx
|   |   `-- layout.tsx
|   |-- api/
|   |   |-- reviews/route.ts
|   |   `-- admin/reviews/
|   |       |-- route.ts
|   |       `-- [id]/status/route.ts
|   `-- admin/(shell)/
|       |-- layout.tsx
|       `-- reviews/page.tsx
|-- components/
|   |-- reviews/
|   |   |-- review-form.tsx
|   |   |-- reviews-section.tsx
|   |   `-- review-card.tsx
|   |-- admin/
|   |   `-- review-manager.tsx
|   `-- shared/
|       `-- floating-cta.tsx
|-- services/
|   `-- review-service.ts
|-- lib/
|   |-- types.ts
|   `-- validation/review.ts
`-- tests/
    |-- api/
    |-- components/
    |-- services/
    `-- tenant-isolation.test.ts

supabase/
`-- migrations/
    `-- [timestamp]_customer_reviews.sql
```

**Structure Decision**: Use the existing single Next.js application and services-layer architecture. Add reviews as their own domain because customer submissions need moderation, private fields, and public display rules that differ from the existing static testimonial rows. Keep the Contact page available and remove only the header navigation item.

## Complexity Tracking

No constitution violations or unusual complexity are required.

## Phase 0 Research

Research is documented in [research.md](./research.md). Key decisions:

- Add a new `customer_reviews` table rather than extending `testimonials`.
- Use pending-by-default moderation before public display.
- Allow public submission through application routes, and serve approved public reviews only through `ReviewService` or an explicit public-safe projection.
- Use admin-scoped moderation APIs guarded by `requireTenantAdmin()`.
- Remove Contact from shell navigation defaults and saved shell content while keeping direct page/CTA/footer access.

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md): customer review fields, moderation statuses, public display rules, validation, and state transitions.
- [contracts/api-contracts.md](./contracts/api-contracts.md): public review submission/list contracts and admin moderation contracts.
- [contracts/ui-flow.md](./contracts/ui-flow.md): visitor and admin review flows, floating action placement, and navigation behavior.
- [quickstart.md](./quickstart.md): stakeholder review checklist plus implementation validation commands and manual acceptance paths.

## Post-Design Constitution Check

- **Single Responsibility**: PASS. Review service owns validation/persistence state; components render public/admin review surfaces.
- **Open/Closed**: PASS. Floating CTA and navigation are extended with focused changes; existing booking/contact flows remain available.
- **Liskov Substitution**: PASS. Existing public pages and testimonials can continue rendering with typed review additions.
- **Interface Segregation**: PASS. Public and admin contracts remain narrow and purpose-specific.
- **Dependency Inversion**: PASS. Database access remains isolated to services and migrations; UI does not instantiate SDK clients.
- **UX & Brand Standards**: PASS. Design reuses current premium card, floating action, toast, and handled error patterns.
- **Testing/Verification**: PASS. Planned tests cover no-public-before-approval, tenant isolation, navigation removal, floating action stacking, and private-field protection.
