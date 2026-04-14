# Implementation Plan: Services Layer Tenant Scoping

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-services-layer-tenant-scoping/spec.md`

## Summary

Convert the entire application code to go through tenant-scoped services. Every
function in `src/services/` takes a `tenantId`. Every inline `supabase.from(...)`
call in `src/app/` and `src/components/` is extracted into a service function.
A `withCurrentTenant()` helper bridges Server Components and Route Handlers to
the services layer. The services layer becomes the single, audited place where
tenant scoping is enforced at the application level.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5, `@supabase/supabase-js` 2.x, `@supabase/ssr` 0.10,
  Zod 4 (already in use), `src/lib/tenant/` from Spec 003.
**Storage**: Supabase — no schema changes; generated types from Spec 002.
**Testing**: Vitest. Reuses the Spec 002 tenant-isolation tests. Adds a new
  `tests/services-contract.test.ts` that calls each service function with a
  mock tenantId and verifies the correct DB row scoping.
**Target Platform**: Next.js full-stack app.
**Project Type**: Refactor (largest in the multi-tenancy effort).
**Performance Goals**: No regression in page load times. Service function
  call overhead < 1ms beyond the underlying Supabase query.
**Constraints**: No new npm dependencies. No database changes. Spec 002 RLS
  remains the backstop — application-layer scoping is defence-in-depth.
**Scale/Scope**: ~6 new service files, ~2 updated service files, every page
  and route handler that currently touches Supabase directly gets refactored.
  Rough count: ~20–30 files touched.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Each service owns exactly one entity's data access | ✅ |
| II. Open/Closed | New services added by composition; existing services extended via new functions, not edits that break callers | ✅ |
| III. Liskov Substitution | Generated types + Zod at boundaries; every service honors its typed contract | ✅ |
| IV. Interface Segregation | Six narrow services instead of one mega-service | ✅ |
| V. Dependency Inversion | THE feature's whole point — this spec is the fix | ✅ |
| UX & Brand | No UI changes | N/A |
| Tech Stack | No new dependencies | ✅ |
| Services Mandate | Fully satisfied after this feature lands | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/004-services-layer-tenant-scoping/
├── plan.md   # This file
└── spec.md   # Feature specification
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── quote-service.ts          # UPDATED: accept tenantId; Zod includes tenantId
│   ├── email-service.ts          # UPDATED: accept tenantId for contextual branding
│   ├── menu-service.ts           # NEW
│   ├── event-service.ts          # NEW
│   ├── testimonial-service.ts    # NEW
│   ├── contact-service.ts        # NEW
│   ├── interaction-service.ts    # NEW
│   └── tenant-service.ts         # NEW (read-only tenant lookup + listing)
├── lib/
│   ├── tenant/
│   │   └── with.ts               # NEW: withCurrentTenant() helper
│   └── supabase/
│       └── server.ts             # POSSIBLY UPDATED: factory takes optional tenantId for logging
└── app/                          # MANY FILES REFACTORED: remove inline supabase calls
tests/
└── services-contract.test.ts     # NEW: per-service contract tests
```

## Implementation Order

1. **Inventory** every direct `supabase.from(` or `createClient(` call
   outside `src/services/` and `src/lib/supabase/`. Record them in the
   feature's `tasks.md` (generated later, when work begins) as explicit
   per-file refactor tasks.
2. **Add `withCurrentTenant()`** helper in `src/lib/tenant/with.ts`.
3. **Create new services** (`menu`, `event`, `testimonial`, `contact`,
   `interaction`, `tenant`). Each service is its own PR-sized unit and
   can land independently.
4. **Update `quote-service.ts` and `email-service.ts`** to accept `tenantId`.
5. **Refactor pages, components, and API routes** in dependency order:
   leaf components first, pages second, route handlers third. Each
   refactor replaces an inline Supabase call with a service call using
   `withCurrentTenant()` or an explicit `tenantId` from the request.
6. **Update `src/lib/types.ts`** `QuoteRequest` to include `tenantId`.
7. **Run `npm test`** — Spec 002 isolation tests MUST still pass.
8. **Run the grep audit**: `rg "supabase\\.from\\(|createClient\\(" src/app src/components`
   MUST return zero results.
9. **Full quickstart** for Feature 001 MUST still pass.

## Notes

- `tasks.md` is intentionally deferred until work starts on this feature.
  The file inventory from step 1 will become the spine of tasks.md.
- This feature is the largest refactor in the multi-tenancy effort. Budget
  accordingly. It is a good candidate for splitting across multiple PRs,
  one per new service.
