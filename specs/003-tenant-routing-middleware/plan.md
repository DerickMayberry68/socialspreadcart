# Implementation Plan: Tenant Routing & Request Context

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-tenant-routing-middleware/spec.md`

## Summary

Extend `src/middleware.ts` to resolve the tenant for every incoming HTTP request
from its host header, attach the tenant UUID to the request via an
`x-tenant-id` header, and reject unknown or non-active tenants. Introduce a
new `src/lib/tenant/` module that centralises the resolution logic and exposes
a `getCurrentTenant()` helper for downstream Server Components, Route Handlers,
and Server Actions. Add a short follow-up SQL migration that adds a reserved-
slug check constraint to `public.tenants`.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5 (middleware, `headers()`, `cache()`),
  `@supabase/ssr` 0.10 (already in use), `@supabase/supabase-js` 2.x.
**Storage**: Supabase — reads from `public.tenants` (no writes in this feature);
  one small migration adding a check constraint for reserved slugs.
**Testing**: Vitest (introduced in Spec 002). Unit tests for
  `resolveTenantFromHost()` using table-driven cases. Integration test for
  middleware using a mocked `NextRequest` (Next.js exposes the types; no real
  server needed).
**Target Platform**: Vercel Edge runtime (or Node runtime — whichever the
  middleware uses in the current project).
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: < 20ms middleware overhead per request; tenant lookup
  cached per request via `cache()`.
**Constraints**: Middleware runs on every request, so the lookup MUST be
  cheap and cache-friendly. No new npm dependencies.
**Scale/Scope**: 1 middleware refactor, 1 new `src/lib/tenant/` module (3–4
  files), 1 new 404 "tenant not found" page, 1 small SQL migration, 1 new
  Vitest test file.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Middleware only routes; resolution logic lives in `src/lib/tenant/resolve.ts`; `getCurrentTenant()` in its own file | ✅ |
| II. Open/Closed | Reserved-slug list is a module constant extended by composition, not fork | ✅ |
| III. Liskov Substitution | `Tenant` type is the generated Supabase row type; `getCurrentTenant()` always returns a full `Tenant` or throws — no partial shapes | ✅ |
| IV. Interface Segregation | `resolveTenantFromHost()` and `getCurrentTenant()` are narrow, single-purpose functions | ✅ |
| V. Dependency Inversion | Middleware calls `resolveTenantFromHost()`; never instantiates a Supabase client inline. The resolver uses `src/lib/supabase/server.ts` (or a new edge-safe factory) | ✅ |
| UX & Brand | 404 tenant-not-found page uses brand tokens (sage / cream) in neutral/platform form | ✅ |
| Tech Stack | No new dependencies | ✅ |
| Services Mandate | Tenant resolution is a `lib/` helper, not a service — it has no business logic, just a DB lookup. Acceptable per constitution Principle IV (narrow purpose). | ✅ |

**Pre-implementation action required**: None. Spec 002 must be applied before
this feature so the `tenants` table exists.

## Project Structure

### Documentation (this feature)

```text
specs/003-tenant-routing-middleware/
├── plan.md              # This file
└── spec.md              # Feature specification
```

> This feature's spec.md is thorough enough that `data-model.md`, `research.md`,
> `quickstart.md`, and `contracts/` are not generated upfront. They can be
> added just-in-time if review surfaces gaps.

### Source Code (repository root)

```text
src/
├── middleware.ts                  # REFACTOR: add tenant resolution; keep admin guard + coming-soon logic
├── lib/
│   └── tenant/
│       ├── index.ts               # NEW: barrel export
│       ├── resolve.ts             # NEW: resolveTenantFromHost(), reserved-slug list, host parsing
│       ├── current.ts             # NEW: getCurrentTenant() Server helper, cache()-wrapped, reads x-tenant-id
│       └── errors.ts              # NEW: TenantResolutionError class
├── app/
│   └── not-found.tsx              # NEW or UPDATED: neutral 404 page for unknown tenant slugs
supabase/
└── migrations/
    └── 20260411_reserved_slugs.sql  # NEW: reserved-slug check constraint on public.tenants
tests/
└── tenant-resolve.test.ts          # NEW: Vitest unit tests for resolveTenantFromHost()
```

**Structure Decision**: The new `src/lib/tenant/` module co-locates all
tenant-context concerns. It is a `lib/` module (not a service) because it
only reads the `tenants` table and exposes pure helpers — no business logic,
no CRUD, no side effects.

## Implementation Order

1. **Add the `src/lib/tenant/` module** with `resolveTenantFromHost()`,
   `getCurrentTenant()`, and `TenantResolutionError`. Write Vitest unit
   tests for the pure host-parsing function first.
2. **Refactor `src/middleware.ts`** to call `resolveTenantFromHost()`, attach
   `x-tenant-id`, and handle unknown/suspended/reserved slugs. Keep all
   existing admin and coming-soon logic intact.
3. **Write the `20260411_reserved_slugs.sql` migration** adding a check
   constraint to `public.tenants`.
4. **Add/update the `src/app/not-found.tsx`** 404 page with neutral branding.
5. **Run the full test suite** (`npm test`) — Spec 002's isolation tests
   MUST still pass; the new `tenant-resolve.test.ts` MUST pass.
6. **Manual smoke test**: run `npm run dev` and visit `sarah.localhost:3000`
   and `joe.localhost:3000`.
