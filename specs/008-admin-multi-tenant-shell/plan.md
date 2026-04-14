# Implementation Plan: Admin Multi-Tenant Shell

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)

## Summary

Move all `/admin/*` routes under a dedicated `app.socialspreadcart.com`
host, teach `getCurrentTenant()` to prefer the active-tenant cookie on
that host, and add a persistent tenant switcher in the admin chrome.
Tenant public subdomains redirect any `/admin*` request to the new host.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5, Supabase Auth, `src/lib/tenant/`
  from Spec 003, `ActiveTenant` cookie helpers and `requireRole()` from
  Spec 006, services layer from Spec 004.
**Storage**: No new tables. Uses existing `tenant_users`.
**Testing**: Vitest. New suite `tests/admin-shell-routing.test.ts`
  covering middleware redirects, cookie-vs-subdomain precedence in
  `getCurrentTenant()`, and `setActiveTenant()` membership verification.
**Target Platform**: Next.js full-stack app, Vercel deploy.
**Constraints**: Public pages MUST continue to resolve by subdomain; only
  admin routes move hosts. No regression to Spec 001 flows.
**Scale/Scope**: 1 middleware update, 1 helper update (`getCurrentTenant`),
  1 new Server Action, 1 new client component (`<TenantSwitcher>`), 1
  follow-up migration reserving the `app` slug, ~2 layout files touched.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Middleware rule is one function; switcher is one component | ✅ |
| IV. Interface Segregation | `TenantService.listMyTenants()` added as a narrow read; switcher depends only on it | ✅ |
| V. Dependency Inversion | Switcher calls a Server Action that calls the service layer; no direct DB from components | ✅ |
| UX & Brand | Admin chrome stays platform-branded; per-tenant accents scoped to data regions | ✅ |
| Tech Stack | No new dependencies | ✅ |

## Project Structure

```text
supabase/migrations/
└── 20260430_reserve_app_slug.sql        # NEW: extend reserved_slugs check to include 'app'

src/
├── middleware.ts                         # UPDATED: 308 redirect /admin* off public hosts; admin-host login gating
├── lib/
│   └── tenant/
│       ├── current.ts                    # UPDATED: cookie-preferred resolution on admin host
│       └── admin-host.ts                 # NEW: isAdminHost(host) predicate
├── services/
│   └── tenant-service.ts                 # UPDATED: listMyTenants() returns [{id, name, role}]
├── components/
│   └── admin/
│       ├── tenant-switcher.tsx           # NEW: client component
│       └── admin-shell.tsx               # UPDATED: mount switcher in top nav
└── app/
    ├── (admin)/
    │   └── admin/
    │       ├── layout.tsx                # UPDATED: render AdminShell, guard via requireRole('staff')
    │       └── actions/
    │           └── set-active-tenant.ts  # NEW: Server Action
    └── login/page.tsx                    # UPDATED: after auth, stay on admin host
tests/
└── admin-shell-routing.test.ts           # NEW
```

## Implementation Order

1. Write `20260430_reserve_app_slug.sql` updating the reserved slugs
   check constraint introduced in Spec 003 to include `app`.
2. Add `src/lib/tenant/admin-host.ts` exporting `isAdminHost(host)` —
   returns true for `app.socialspreadcart.com` in prod and `app.localhost`
   or `app.localhost:3000` in dev.
3. Update `src/lib/tenant/current.ts` so `getCurrentTenant()` branches:
   - Admin host → read the active-tenant cookie; if missing or stale,
     call `listMyTenants()` and pick the first; repair the cookie.
   - Tenant public host → existing subdomain resolver.
4. Update `src/middleware.ts`:
   - If `isAdminHost(host) === false` and the pathname starts with
     `/admin`, return a 308 to the same path on the admin host.
   - If `isAdminHost(host) === true`, apply the Spec 006 login guard.
5. Add `listMyTenants()` to `TenantService` returning
   `{ id, name, role }[]` for the current user. Tests already seed two
   tenants per user via the Spec 002 harness.
6. Add `src/app/(admin)/admin/actions/set-active-tenant.ts` Server
   Action: verifies membership via `listMyTenants()`, writes the cookie,
   returns `revalidatePath(current)`.
7. Build `src/components/admin/tenant-switcher.tsx`: client component,
   takes `memberships` + `activeTenantId` as props, renders a dropdown,
   calls the Server Action on change.
8. Update `src/components/admin/admin-shell.tsx` to fetch memberships
   server-side and mount the switcher in the nav.
9. Update `src/app/(admin)/admin/layout.tsx` to call
   `requireRole('staff')` (Spec 006) before rendering.
10. Update `src/app/login/page.tsx` post-auth routing so it lands on
    the admin host; on a tenant public host, send the user to
    `app.socialspreadcart.com/login` first.
11. Write `tests/admin-shell-routing.test.ts`:
    - Middleware 308 from tenant host `/admin` → admin host `/admin`.
    - `getCurrentTenant()` cookie preference on admin host.
    - `getCurrentTenant()` subdomain preference on tenant host.
    - `setActiveTenant()` rejects non-member tenant IDs.
12. Run full `npm test` and Spec 001 quickstart on a tenant public host
    to confirm zero regression.
