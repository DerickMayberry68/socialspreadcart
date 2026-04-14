# Feature Specification: Tenant Routing & Request Context

**Feature Branch**: `003-tenant-routing-middleware`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Resolve the current tenant for every incoming HTTP request from the request's subdomain, put it into a request-scoped context the rest of the application can read, and keep the legacy bare domain resolving to the 'sarah' tenant during the cutover period."

## Context

Spec 002 introduced `tenants`, `tenant_users`, and tenant-scoped RLS, but
every page, API route, and service still behaves as if there is exactly one
tenant. There is no mechanism to know *which* tenant a given HTTP request is
for. This feature closes that gap.

The plan is subdomain-based: `sarah.socialspreadcart.com` serves the sarah
tenant, `joe.socialspreadcart.com` serves the joe tenant, and the bare
`socialspreadcart.com` serves the sarah tenant during the transition period
so the existing production site keeps working. The admin app lives at
`app.socialspreadcart.com` and is the subject of Spec 008 — this feature
only sets the context so later specs can use it.

## User Scenarios & Testing

### User Story 1 — Subdomain Selects The Correct Tenant (Priority: P1)

When a visitor requests `{slug}.socialspreadcart.com/menu`, the middleware
looks up the tenant by slug, attaches the tenant id to the request, and the
page renders that tenant's menu. An unknown slug returns a 404 tenant-not-
found page instead of leaking another tenant's content.

**Why this priority**: Every subsequent feature — brand rendering, services
scoping, admin switcher, signup — depends on this routing layer.

**Independent Test**: Seed two tenants (sarah, joe). Request
`http://sarah.localhost:3000/menu` and confirm sarah's menu renders. Request
`http://joe.localhost:3000/menu` and confirm joe's menu renders. Request
`http://missing.localhost:3000/menu` and confirm a 404 renders.

**Acceptance Scenarios**:

1. **Given** a tenant with slug `sarah` exists, **When** a request arrives
   at `sarah.socialspreadcart.com/menu`, **Then** `request.headers.get('x-tenant-id')`
   in any downstream handler returns sarah's UUID.
2. **Given** no tenant with slug `missing` exists, **When** a request
   arrives at `missing.socialspreadcart.com/menu`, **Then** the response is
   a 404 tenant-not-found page.
3. **Given** a tenant exists but is `suspended` or `archived`, **When** a
   request arrives at its subdomain, **Then** the response is a 410 Gone /
   tenant-suspended page; no tenant data is exposed.

---

### User Story 2 — Bare Domain Resolves To Legacy Tenant (Priority: P1)

Visitors hitting `socialspreadcart.com` (with no subdomain) during the
transition period are treated as visitors of the legacy tenant `sarah`.
This allows the existing production deployment to keep working without a
DNS change, and gives us a hard deadline to remove the fallback later.

**Why this priority**: Zero-downtime cutover is a hard requirement. The
existing site cannot break the day this feature ships.

**Independent Test**: Request `http://localhost:3000/menu` (no subdomain).
Confirm sarah's menu renders. Confirm `x-tenant-id` equals sarah's UUID.

**Acceptance Scenarios**:

1. **Given** the bare domain has no subdomain, **When** any request arrives
   at `socialspreadcart.com`, **Then** the middleware resolves the tenant
   to `sarah` and attaches its id to the request.
2. **Given** a feature flag `ENABLE_BARE_DOMAIN_LEGACY=false`, **When** any
   request arrives at `socialspreadcart.com`, **Then** the response is a
   302 redirect to `sarah.socialspreadcart.com` preserving the path.

---

### User Story 3 — Downstream Code Can Read The Current Tenant (Priority: P2)

Server Components, Route Handlers, and Server Actions need a single
canonical way to ask "what tenant am I currently serving?". The tenant is
attached to the request in middleware via a header, and a tiny helper
`getCurrentTenant()` reads that header and returns a typed `Tenant` object
(or throws a `TenantNotFoundError`).

**Why this priority**: This is the contract every future feature depends on.
Without it, services and pages would re-implement their own tenant resolution
and drift apart.

**Independent Test**: In a test Server Component, call `getCurrentTenant()`.
Confirm it returns the tenant matching the subdomain of the current request.

**Acceptance Scenarios**:

1. **Given** middleware has set `x-tenant-id`, **When** any Server Component,
   Route Handler, or Server Action calls `getCurrentTenant()`, **Then** it
   returns a `Tenant` object with at least `id`, `slug`, `name`, and `status`.
2. **Given** middleware has NOT set `x-tenant-id` (a direct request missing
   the middleware layer — e.g., static asset fetches), **When** any server
   code calls `getCurrentTenant()`, **Then** it throws a
   `TenantResolutionError` with a clear message.

---

### User Story 4 — Development Workflow Is Not Painful (Priority: P3)

A developer running `npm run dev` locally should be able to test multiple
tenants without hosts-file gymnastics. At minimum: subdomain
`sarah.localhost:3000` and `joe.localhost:3000` MUST work on a stock
macOS/Linux/Windows dev machine without manual `/etc/hosts` edits (browsers
already resolve `*.localhost` to 127.0.0.1). As a fallback, the middleware
supports a `?_tenant=sarah` query parameter for browsers that disagree.

**Why this priority**: Developer experience. If it's painful to run two
tenants locally, the team will introduce bugs they can't reproduce.

**Independent Test**: Start `npm run dev`. Visit
`http://sarah.localhost:3000` and `http://joe.localhost:3000` in Chrome.
Both should resolve. Also visit `http://localhost:3000?_tenant=joe` and
confirm it serves joe.

**Acceptance Scenarios**:

1. **Given** the dev server is running and two tenants are seeded, **When**
   a developer visits `sarah.localhost:3000` in a browser, **Then** sarah's
   site renders.
2. **Given** the dev server is running, **When** a developer appends
   `?_tenant=joe` to any URL, **Then** the request is treated as a joe-tenant
   request and the query parameter is accepted ONLY in `NODE_ENV=development`.

---

### Edge Cases

- **`www.socialspreadcart.com`**: treat `www` as "bare domain" and resolve
  to the legacy tenant (same as no subdomain).
- **Multiple subdomains** (`foo.bar.socialspreadcart.com`): reject with 404.
  Tenant slugs are a single DNS label.
- **Port-suffixed hosts** (`sarah.localhost:3000`): the resolver strips the
  port before extracting the subdomain.
- **Reserved slugs**: `app`, `api`, `www`, `admin`, `auth`, `status`,
  `docs`, `staging`, `cdn`, `mail` MUST NOT be resolvable as tenant slugs
  even if a row exists with that slug — the resolver returns 404 for them.
  The corresponding tenants table check constraint is tightened in this
  feature's SQL migration.
- **Case sensitivity**: hostnames are case-insensitive; the resolver
  lowercases the hostname before matching against `tenants.slug`.
- **Caching**: the tenant lookup per-request is cached for the duration of
  the request (via `cache()` from `react`) so that multiple calls to
  `getCurrentTenant()` inside a single request hit the DB at most once.

## Requirements

### Functional Requirements

- **FR-001**: The Next.js middleware (`src/middleware.ts`) MUST extract the
  hostname from each incoming request, strip any port, lowercase it, and
  parse the leading subdomain label.
- **FR-002**: The middleware MUST look up the tenant by slug in
  `public.tenants` and reject unknown or non-active tenants with an
  appropriate error response (404 for unknown; 410 for suspended/archived).
- **FR-003**: The middleware MUST attach the resolved tenant's UUID to the
  request via an `x-tenant-id` request header before forwarding downstream.
- **FR-004**: A new `src/lib/tenant/` module MUST export:
  - `resolveTenantFromHost(host: string): Promise<Tenant | null>` — pure
    lookup function usable from middleware and anywhere else.
  - `getCurrentTenant(): Promise<Tenant>` — Server Component / Route
    Handler / Server Action helper that reads `x-tenant-id` from the
    `headers()` store and fetches the tenant. Throws `TenantResolutionError`
    on missing header. Memoized with `cache()` for the request lifetime.
  - `TenantResolutionError` — typed error class.
- **FR-005**: Requests to the bare domain (or `www`) MUST resolve to the
  legacy tenant (`slug = 'sarah'`) as long as the feature flag
  `ENABLE_BARE_DOMAIN_LEGACY` is truthy. Default: truthy.
- **FR-006**: When `ENABLE_BARE_DOMAIN_LEGACY=false`, bare-domain requests
  MUST 302 to `https://sarah.<APP_DOMAIN>/{path}`.
- **FR-007**: In development mode ONLY, the middleware MUST accept
  `?_tenant=<slug>` as an override. The override MUST be stripped from the
  forwarded URL so it does not leak into page content.
- **FR-008**: Reserved slugs (`app`, `api`, `www`, `admin`, `auth`, `status`,
  `docs`, `staging`, `cdn`, `mail`) MUST NOT resolve as tenant slugs. A new
  small SQL migration MUST add a database check constraint enforcing this.
- **FR-009**: The admin auth guard in the current middleware MUST continue
  to work for the `/admin` path namespace. After this feature, the admin
  app is intended to live at `app.<APP_DOMAIN>`; until Spec 008 moves it,
  both paths (`/admin` on a tenant subdomain and `app.<APP_DOMAIN>/admin`)
  MUST continue to work.
- **FR-010**: The middleware MUST NOT perform a tenant lookup for static
  asset paths (`/_next/*`, `/favicon.ico`, `/brand/*`) — those paths skip
  resolution entirely for performance.
- **FR-011**: A 404 "tenant not found" page MUST exist at
  `src/app/(marketing)/not-found.tsx` (or wherever the app router's 404
  convention lives) and MUST be branded with neutral SocialSpreadCart
  styling, not any specific tenant's brand.

### Key Entities

- **Tenant** (as defined in Spec 002): `{ id, slug, name, status, createdAt, updatedAt }`.
- **TenantResolutionError**: a typed error with `code` one of
  `missing_header`, `unknown_slug`, `suspended`, `archived`, `reserved`.
- **Request Tenant Context**: an `x-tenant-id` header present on every
  non-static request after middleware runs.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of non-static requests have a resolved tenant by the time
  they reach a Server Component, Route Handler, or Server Action.
- **SC-002**: Middleware adds less than 20ms of overhead per request on
  average (tenant lookup is cached and hits a single indexed column).
- **SC-003**: The existing production site at `socialspreadcart.com`
  continues to render identically before and after this feature ships.
- **SC-004**: Vitest suite covering `resolveTenantFromHost()` passes with
  at least 12 cases: valid slug, invalid slug, reserved slug, bare domain,
  `www`, suspended, archived, uppercase, port suffix, multi-label,
  dev-mode override, production-mode override rejected.
- **SC-005**: A developer can run two tenants locally and visit both in
  a browser without editing `/etc/hosts`.

## Assumptions

- DNS configuration (wildcard `*.socialspreadcart.com` → the Next.js app)
  is out of scope for this spec — it is an infrastructure task documented
  separately in the migration plan.
- This spec does not change `src/app/admin/*` layout or routes. The admin
  app relocation to `app.socialspreadcart.com` is Spec 008.
- The feature flag `ENABLE_BARE_DOMAIN_LEGACY` is an environment variable,
  not a database setting. Its removal timeline is tied to Spec 009 going
  live.
- Reserved-slug enforcement is belt-and-suspenders: middleware refuses to
  resolve them AND the database rejects them via a check constraint. Both
  layers exist on purpose.
- Request-scoped caching uses React's `cache()` from `"react"` — the
  canonical Next.js pattern. No new dependency.
