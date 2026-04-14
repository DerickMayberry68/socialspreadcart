---
description: "Task list for Tenant Routing & Request Context implementation"
---

# Tasks: Tenant Routing & Request Context

**Input**: Design documents from `specs/003-tenant-routing-middleware/`
**Prerequisites**: spec.md ✅, plan.md ✅, Spec 002 migration applied ✅, 34/34 tests green ✅

**Tests**: Required. `tests/tenant-resolve.test.ts` (unit) + Spec 002 suite must remain green.

**Organization**: Build the `src/lib/tenant/` module and its tests first
(pure TypeScript, no server needed), then wire it into middleware, then add
the SQL migration and 404 page, then verify end-to-end.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: `src/lib/tenant/` Module

**Purpose**: All resolution logic lives here. Middleware is a thin caller.

- [ ] T001 Create `src/lib/tenant/errors.ts` exporting:
  ```ts
  export type TenantResolutionCode =
    | 'missing_header'
    | 'unknown_slug'
    | 'suspended'
    | 'archived'
    | 'reserved';

  export class TenantResolutionError extends Error {
    constructor(public readonly code: TenantResolutionCode, message: string) {
      super(message);
      this.name = 'TenantResolutionError';
    }
  }
  ```

- [ ] T002 Create `src/lib/tenant/resolve.ts` exporting:
  - `RESERVED_SLUGS: readonly string[]` — `['app','api','www','admin','auth','status','docs','staging','cdn','mail']`
  - `parseSubdomain(host: string): string | null` — strips port, lowercases, returns the leading subdomain label or null if bare/www/multi-label
  - `resolveTenantFromHost(host: string, supabase: SupabaseClient): Promise<Tenant | TenantResolutionError>` — uses `parseSubdomain`, checks reserved list, queries `public.tenants` by slug, returns typed result
  - The function must handle: bare domain → legacy slug (`'sarah'`), `www` → legacy slug, reserved → `TenantResolutionError('reserved')`, unknown → `TenantResolutionError('unknown_slug')`, suspended/archived → appropriate error
  - Bare-domain fallback is controlled by `process.env.ENABLE_BARE_DOMAIN_LEGACY !== 'false'`

- [ ] T003 Create `src/lib/tenant/current.ts` exporting:
  - `getCurrentTenant(): Promise<Tenant>` — reads `x-tenant-id` from `headers()` (Next.js), queries `public.tenants` by id, throws `TenantResolutionError('missing_header')` if header absent. Wrapped in `cache()` from `"react"` so the DB is hit at most once per request.

- [ ] T004 Create `src/lib/tenant/index.ts` barrel-exporting everything from `errors.ts`, `resolve.ts`, `current.ts`:
  ```ts
  export * from './errors';
  export * from './resolve';
  export * from './current';
  ```

**Checkpoint**: `src/lib/tenant/` compiles with `tsc --noEmit`. No tests yet.

---

## Phase 2: Unit Tests

**Purpose**: Prove the pure host-parsing and slug-resolution logic before touching middleware.

- [ ] T005 Create `tests/tenant-resolve.test.ts` with a table-driven describe block
  for `parseSubdomain(host)`:
  - `'sarah.socialspreadcart.com'` → `'sarah'`
  - `'sarah.localhost:3000'` → `'sarah'`
  - `'socialspreadcart.com'` (bare) → `null`
  - `'localhost:3000'` (bare) → `null`
  - `'www.socialspreadcart.com'` → `null` (www treated as bare)
  - `'foo.bar.socialspreadcart.com'` (multi-label) → `null`
  - `'SARAH.socialspreadcart.com'` (uppercase) → `'sarah'`

- [ ] T006 Add a describe block for `resolveTenantFromHost()` using a mocked
  Supabase client (simple object with `.from().select().eq().single()` chain
  returning controllable fixtures). Vitest's `vi.fn()` is sufficient — no real
  DB call needed here:
  - Valid slug → returns `Tenant` object
  - Unknown slug (DB returns null) → returns `TenantResolutionError('unknown_slug')`
  - Reserved slug (`'app'`) → returns `TenantResolutionError('reserved')` without hitting DB
  - Suspended tenant → returns `TenantResolutionError('suspended')`
  - Archived tenant → returns `TenantResolutionError('archived')`
  - Bare domain, `ENABLE_BARE_DOMAIN_LEGACY=true` → resolves to legacy tenant
  - Bare domain, `ENABLE_BARE_DOMAIN_LEGACY=false` → returns `TenantResolutionError('unknown_slug')` (redirect handled by caller)
  - `?_tenant=` override in `NODE_ENV=development` → resolves override slug
  - `?_tenant=` override in `NODE_ENV=production` → ignored

- [ ] T007 Run `npm test` — both `tenant-resolve.test.ts` and
  `tenant-isolation.test.ts` must pass. If Spec 002 isolation tests break,
  stop and investigate before continuing.

**Checkpoint**: All tests green. Resolution logic is proven correct in isolation.

---

## Phase 3: Middleware Refactor

**Purpose**: Wire `resolveTenantFromHost()` into the existing middleware,
keeping admin guard and coming-soon logic intact.

- [ ] T008 [US1, US2] Refactor `src/middleware.ts`:
  - Import `resolveTenantFromHost` and `TenantResolutionError` from `@/lib/tenant`
  - At the top of `middleware()`, before the admin guard, skip resolution for static paths: `/_next/*`, `/favicon.ico`, `/brand/*`, `/api/auth/*`
  - Extract `host` from `request.headers.get('host') ?? ''`
  - Call `resolveTenantFromHost(host, supabase)` — reuse the existing Supabase client already created for the admin guard (or create a lightweight read-only one)
  - On `TenantResolutionError`:
    - `'unknown_slug'` or `'reserved'` → `NextResponse.rewrite(new URL('/not-found', request.url))` with status 404
    - `'suspended'` or `'archived'` → rewrite to a 410 page (or 404 is acceptable for MVP)
    - `'missing_header'` → should not occur in middleware; log and continue
  - On success → `NextResponse.next({ headers: { 'x-tenant-id': tenant.id } })`
  - Bare domain `ENABLE_BARE_DOMAIN_LEGACY=false` → `NextResponse.redirect` to `https://sarah.${process.env.NEXT_PUBLIC_APP_DOMAIN}/${pathname}`
  - Dev-mode `?_tenant=` override: strip the param from the forwarded URL so it doesn't appear in page props
  - Keep admin auth guard and coming-soon logic unchanged — they run after tenant resolution

- [ ] T009 [US3] Verify `getCurrentTenant()` works downstream by adding a
  temporary `console.log(await getCurrentTenant())` to one existing Server
  Component (e.g. `src/app/page.tsx`), starting the dev server, and visiting
  `sarah.localhost:3000`. Confirm the log shows the sarah tenant object.
  Remove the log after confirming.

**Checkpoint**: `npm run dev` works. `sarah.localhost:3000` renders with tenant
context. Unknown subdomain returns 404. Admin guard still works.

---

## Phase 4: SQL Migration

**Purpose**: Belt-and-suspenders reserved-slug enforcement at the DB layer.

- [ ] T010 [P] Create `supabase/migrations/20260411_reserved_slugs.sql`:
  ```sql
  alter table public.tenants
    drop constraint if exists tenants_slug_not_reserved,
    add constraint tenants_slug_not_reserved
      check (slug not in (
        'app','api','www','admin','auth','status',
        'docs','staging','cdn','mail'
      ));
  ```
  Apply it to your hosted project via the SQL editor.

**Checkpoint**: `insert into tenants (slug, name) values ('app', 'test')` is
rejected with a constraint violation.

---

## Phase 5: 404 Page

**Purpose**: Unknown tenant slugs get a clean, neutral error page.

- [ ] T011 [P] [US1] Create or update `src/app/not-found.tsx` (Next.js
  App Router convention) with a neutral SocialSpreadCart-branded 404 message:
  "We couldn't find that cart." Link back to the main marketing site.
  Do NOT use any per-tenant brand tokens (no CSS variables from Spec 005) —
  this page renders before tenant resolution succeeds.

**Checkpoint**: Visiting `http://missing.localhost:3000` renders the 404 page.

---

## Phase 6: Final Verification

- [ ] T012 Run `npm test` one final time. Both suites must pass:
  - `tests/tenant-resolve.test.ts` — all `parseSubdomain` + `resolveTenantFromHost` cases ✅
  - `tests/tenant-isolation.test.ts` — all 34 isolation tests still green ✅

- [ ] T013 Manual smoke test:
  - `npm run dev`
  - Visit `http://sarah.localhost:3000` → sarah's site renders
  - Visit `http://localhost:3000?_tenant=sarah` (dev override) → sarah's site renders
  - Visit `http://missing.localhost:3000` → 404 page renders
  - Visit `http://localhost:3000/admin` → admin guard redirects to login (unchanged)
  - Visit `http://app.localhost:3000/admin` → confirm behaviour is whatever it was before (no regression)

- [ ] T014 Run `npm run build` — confirm zero TypeScript errors.

---

## Dependencies & Execution Order

```
Phase 1 (T001–T004): lib/tenant module — no dependencies, start immediately
Phase 2 (T005–T007): unit tests — depend on Phase 1
Phase 3 (T008–T009): middleware — depend on Phase 2 green
Phase 4 (T010):      SQL migration — [P] with Phase 3, no code dependency
Phase 5 (T011):      404 page — [P] with Phase 3, no code dependency
Phase 6 (T012–T014): verification — depends on all prior phases
```

T010 and T011 can be done any time after Phase 1 since they touch
different files (SQL and a single page component).

---

## STOP Condition

If T007 (first test run) fails on `tenant-resolve.test.ts`:
- The mock setup is wrong → fix the mock, not the resolver
- A business rule is wrong (e.g. reserved slug bypass hits DB) → fix `resolve.ts`

If T007 fails on `tenant-isolation.test.ts` (Spec 002 regression):
- A type import from `src/lib/tenant/` changed the module graph in a breaking way → check for circular imports

Never modify `tenant-isolation.test.ts` to make it pass — those are security invariants.

---

## Notes

- `parseSubdomain` is a pure function (no I/O) — unit test it without mocks.
- `resolveTenantFromHost` has I/O (DB call) — unit test with a simple vi.fn() mock, save real-DB tests for the manual smoke test.
- The middleware still uses a single `NextResponse` response object for the cookie-refresh pattern (admin guard). Ensure the tenant header is set on the same response object that gets returned, not a discarded intermediate.
- `getCurrentTenant()` uses `cache()` from React — this only works in Server Components and Route Handlers in the App Router. It will throw in Client Components (correct behaviour — never call it there).
- This feature does NOT change any page or service to use `getCurrentTenant()` yet — that's Spec 004. The goal here is that the header is present and the helper works; adoption is the next spec.
