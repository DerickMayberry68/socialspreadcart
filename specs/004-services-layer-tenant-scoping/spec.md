# Feature Specification: Services Layer Tenant Scoping

**Feature Branch**: `004-services-layer-tenant-scoping`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Update every service in src/services/ to take (or derive) a tenantId parameter on every function, pass it into every Supabase query, validate it with Zod, and fail loudly if it's missing. No component, page, or API route is allowed to query Supabase directly — everything goes through services scoped to the current tenant."

## Context

Spec 002 added the `tenant_id` column and RLS policies. Spec 003 made the
current tenant resolvable from the request. This feature is where the
**application code** starts honouring the multi-tenant boundary end-to-end.

Today, `src/services/quote-service.ts` and `src/services/email-service.ts`
exist for Feature 001 but assume a single tenant. Every other place that
touches Supabase does it inline inside a page, component, or route handler
— a direct violation of the constitution. This feature fixes both problems
in one pass: extract every remaining inline Supabase call into a service,
and scope every service function to a tenant.

## User Scenarios & Testing

### User Story 1 — Every Service Function Takes A Tenant Id (Priority: P1)

Every function exported from `src/services/` takes a `tenantId: string` as
its first parameter (or as a required field inside an input object). No
function is allowed to "guess" the tenant from ambient state. All Supabase
queries issued by that function include `.eq('tenant_id', tenantId)` on
reads and set `tenant_id: tenantId` on writes.

**Why this priority**: The whole multi-tenancy effort hinges on this.
Without it, the services layer keeps working against a single-tenant
mental model and quietly leaks data at the application level.

**Independent Test**: Grep the codebase for every exported function in
`src/services/` and confirm each one has a `tenantId` parameter. Confirm
every Supabase call inside each function references `tenantId`. A lint
rule (or a code-review checklist) enforces this going forward.

**Acceptance Scenarios**:

1. **Given** any service function like `QuoteService.listQuotes()`,
   **When** called without a `tenantId`, **Then** TypeScript rejects the
   call at compile time.
2. **Given** a service function receives a `tenantId`, **When** it reads
   from Supabase, **Then** the query includes a `.eq('tenant_id', tenantId)`
   filter (or an RPC that enforces the same constraint).
3. **Given** a service function receives a `tenantId`, **When** it writes
   to Supabase, **Then** `tenant_id` is set on the insert/update payload.

---

### User Story 2 — No Page, Component, Or Route Queries Supabase Directly (Priority: P1)

Every remaining inline `supabase.from(...)` call in `src/app/`,
`src/components/`, and `src/app/api/` is moved into a service function and
replaced with a call to that service. After this feature, a grep for
`createClient(` or `.from(` outside `src/services/` and `src/lib/supabase/`
MUST return zero results.

**Why this priority**: Constitution Principle V (Dependency Inversion) is
non-negotiable. This is the compliance fix.

**Independent Test**: Run `rg "from\\(|createClient" src/app src/components`
and confirm zero matches (allowing for hits inside comments or strings).

**Acceptance Scenarios**:

1. **Given** the codebase after this feature ships, **When** searched for
   `supabase.from(` anywhere outside `src/services/` and `src/lib/supabase/`,
   **Then** the search returns zero results.
2. **Given** a page needs to load menu items, **When** the page code is
   written, **Then** it calls `MenuService.listMenuItems(tenantId)` — never
   the Supabase client directly.

---

### User Story 3 — Services Derive `tenantId` From Request Context In Server Code (Priority: P2)

In Server Components, Route Handlers, and Server Actions, the call pattern
is `const tenant = await getCurrentTenant(); const items = await
MenuService.listMenuItems(tenant.id);`. A thin wrapper
`withCurrentTenant(fn)` exists for callers who want to skip the manual
step, so the common case reads: `const items = await
withCurrentTenant(MenuService.listMenuItems);`.

**Why this priority**: Ergonomics. Without a wrapper, every call site
repeats the same two lines.

**Independent Test**: Convert one existing page to use
`withCurrentTenant(MenuService.listMenuItems)` and confirm it compiles and
returns only the current tenant's rows.

**Acceptance Scenarios**:

1. **Given** a Server Component running inside a request where middleware
   has set `x-tenant-id`, **When** the component calls
   `withCurrentTenant(MenuService.listMenuItems)`, **Then** the helper
   resolves the current tenant, passes its id into the service, and returns
   the result.
2. **Given** a Server Component running outside a request context,
   **When** the component calls `withCurrentTenant(...)`, **Then** the
   helper throws a `TenantResolutionError` (from Spec 003).

---

### User Story 4 — Zod Validates Tenant-Scoped Inputs At Service Boundaries (Priority: P2)

Every service function that accepts external input (an HTTP body, a form
payload, a URL parameter) validates it with a Zod schema that includes
`tenantId: z.string().uuid()`. Service functions that take trusted inputs
from other services skip the Zod check but still enforce the `tenantId`
type via TypeScript.

**Why this priority**: Constitution Principle III (Liskov Substitution) —
callers trust the service's typed contract. Zod is how we enforce it at
the boundary.

**Independent Test**: Submit a quote via `POST /api/quote` with a
malformed `tenantId` (non-UUID string). Confirm the request is rejected
with a 400 and the error message names `tenantId`.

**Acceptance Scenarios**:

1. **Given** a service function with a Zod input schema, **When** the
   caller passes a payload with `tenantId = "not-a-uuid"`, **Then** the
   service throws a Zod validation error before touching Supabase.
2. **Given** a route handler receives a POST body, **When** it calls a
   service function, **Then** the handler does NOT redundantly parse the
   body itself — the service owns validation.

---

### Edge Cases

- **Background jobs / cron tasks**: any future scheduled task that runs
  outside an HTTP request MUST pass a `tenantId` explicitly; it cannot use
  `withCurrentTenant()` because there is no request context. This is a
  documented convention enforced by code review.
- **Cross-tenant admin tasks** (e.g., platform-level reporting across all
  tenants): services MUST NOT expose a "null tenantId = all tenants"
  escape hatch. A separate `PlatformService` (deferred to Spec 008) will
  own any cross-tenant queries using the service-role client with explicit
  audit logging.
- **Anonymous quote submission**: `QuoteService.submitQuote()` accepts a
  `tenantId` argument set by the API route (which reads it from the
  current request's tenant header). The anon client is used for the actual
  insert; the `with check` RLS policy validates the tenant id against
  `public.tenants`.
- **Type drift**: the generated Supabase types (`database.types.ts`) include
  `tenant_id`. Any service that forgets to pass it will fail to compile.

## Requirements

### Functional Requirements

- **FR-001**: Every exported function in `src/services/` MUST require a
  `tenantId: string` input (either as a positional argument or a required
  object property) typed as a UUID.
- **FR-002**: Every Supabase read in a service MUST include
  `.eq('tenant_id', tenantId)` or use an RPC that enforces the same.
- **FR-003**: Every Supabase write in a service MUST set `tenant_id:
  tenantId` on the insert/update payload.
- **FR-004**: No code outside `src/services/` and `src/lib/supabase/` MAY
  import `@supabase/supabase-js` or `@supabase/ssr` directly. All data
  access MUST go through a service.
- **FR-005**: A helper `withCurrentTenant<T>(fn: (tenantId: string) =>
  Promise<T>): Promise<T>` MUST exist in `src/lib/tenant/current.ts` (or
  a new `src/lib/tenant/with.ts`).
- **FR-006**: All input-validating services (those that accept external
  user input) MUST validate their input with a Zod schema that includes
  `tenantId: z.string().uuid()`.
- **FR-007**: The following existing services MUST be updated:
  `quote-service.ts`, `email-service.ts`.
- **FR-008**: The following new services MUST be introduced (migrating
  existing inline code out of pages/components/routes):
  `menu-service.ts`, `event-service.ts`, `testimonial-service.ts`,
  `contact-service.ts`, `interaction-service.ts`, `tenant-service.ts`
  (read-only helper functions for listing and looking up tenants — used
  by middleware and the admin switcher).
- **FR-009**: A constitution check lint script MUST exist (or at minimum,
  a documented grep command in `quickstart.md`) that reports any direct
  Supabase import outside `src/services/` and `src/lib/supabase/`.
- **FR-010**: The Spec 002 isolation tests (`tests/tenant-isolation.test.ts`)
  MUST still pass after this refactor — the DB-layer guarantee is
  unchanged; only the application-layer contract is tightened.

### Key Entities

No new entities. This feature is about how existing entities are accessed.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `rg "supabase\\.from\\(|createClient\\(" src/app src/components`
  returns zero results.
- **SC-002**: 100% of service functions compile only when passed a
  `tenantId` (verified by `npm run build`).
- **SC-003**: `npm test` passes all Spec 002 isolation tests unchanged.
- **SC-004**: At least one page per `(site)` route and the `/admin` route
  namespace is converted to `withCurrentTenant()` to prove the pattern.
- **SC-005**: `POST /api/quote` still succeeds end-to-end for the legacy
  tenant and correctly sets `tenant_id` on the inserted row.

## Assumptions

- Spec 002 and Spec 003 are in place before this feature starts.
- The service-role Supabase client (used for admin writes and for anon
  quote submission) is wrapped in a factory in `src/lib/supabase/` that
  takes a `tenantId` and returns a client scoped to it (or a client with
  the tenant id stamped into every query by convention — implementation
  choice to be made in the plan).
- `src/lib/types.ts` `QuoteRequest` is updated to include `tenantId` once,
  and the form submission path includes the current tenant id from
  `getCurrentTenant()` in the API route.
- This feature introduces a meaningful amount of code change across many
  files. It is the biggest refactor in the multi-tenancy effort and should
  be scoped as its own PR with its own tasks.md.
- No database changes in this feature.
