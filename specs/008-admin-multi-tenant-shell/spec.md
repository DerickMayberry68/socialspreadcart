# Feature Specification: Admin Multi-Tenant Shell

**Feature Branch**: `008-admin-multi-tenant-shell`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Consolidate tenant administration behind a single `app.socialspreadcart.com` host, provide a persistent tenant switcher in the admin chrome, and move existing `/admin/*` pages off the tenant's public subdomain so operators manage every tenant from one place."

## Context

Today the admin UI lives at `/admin/*` on whatever host is serving the
legacy tenant. Spec 003 establishes subdomain-based public site routing
(`<tenant>.socialspreadcart.com`), and Spec 006 introduces multi-tenant
users with an active-tenant cookie. Once owners can belong to more than
one tenant, running the admin on a tenant subdomain no longer makes sense:
a user managing tenants A and B would be bouncing between hosts just to
navigate their own data.

This feature carves the admin out into its own host, `app.socialspreadcart.com`,
which is tenant-agnostic at the URL level. The active tenant is determined
by the cookie set during login (Spec 006). A persistent switcher in the
admin chrome lets multi-tenant users change contexts without logging out.
All existing `/admin/*` routes move under this host. The tenant's public
subdomain serves ONLY public pages.

## User Scenarios & Testing

### User Story 1 — Admin Lives On `app.socialspreadcart.com` (Priority: P1)

An owner navigates to `app.socialspreadcart.com`. If they are not logged
in, they see the login page. If they are logged in and belong to exactly
one tenant, they are routed to `/admin` with the active tenant cookie
already set. The public tenant subdomains no longer serve admin routes;
visiting `sarah.socialspreadcart.com/admin` returns a redirect to
`app.socialspreadcart.com/admin`.

**Why this priority**: This establishes the hostname separation that
every other admin-side feature depends on.

**Independent Test**: Log in on `app.socialspreadcart.com`. Confirm
`/admin` renders for the active tenant. Visit `sarah.socialspreadcart.com/admin`.
Confirm a 308 redirect to `app.socialspreadcart.com/admin`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they open
   `app.socialspreadcart.com`, **Then** they see the login page.
2. **Given** an authenticated single-tenant user, **When** they open
   `app.socialspreadcart.com`, **Then** they are redirected to `/admin`
   for their tenant.
3. **Given** any request to `<tenant>.socialspreadcart.com/admin*`,
   **When** the middleware runs, **Then** the response is a 308 to the
   same path on `app.socialspreadcart.com`.

---

### User Story 2 — Persistent Tenant Switcher (Priority: P1)

The admin shell renders a tenant switcher in the top nav. It lists every
tenant the current user belongs to, shows the active one, and lets the
user switch with a click. Switching calls a Server Action that updates
the active-tenant cookie (Spec 006) and reloads the current admin path
(`/admin/quotes` stays on `/admin/quotes`, now for the new tenant).

**Why this priority**: Without a switcher, a multi-tenant owner must log
out and back in, which is painful for demos and for operators managing
multiple locations.

**Independent Test**: As a user who belongs to tenants A and B, log in
and open `/admin/quotes`. Confirm the switcher lists A and B with A
active. Click B. Confirm the page reloads with `/admin/quotes` and the
query results are tenant B's.

**Acceptance Scenarios**:

1. **Given** a user with multiple tenant memberships, **When** the admin
   chrome renders, **Then** a switcher shows every tenant with the
   active one highlighted.
2. **Given** the switcher is open, **When** the user selects a different
   tenant, **Then** the active-tenant cookie is updated and the current
   path is reloaded without changing the path.
3. **Given** a user with a single tenant membership, **When** the admin
   chrome renders, **Then** the switcher is hidden (or shown as a
   non-interactive label).

---

### User Story 3 — Admin Routes Resolve Tenant From Cookie, Not Host (Priority: P2)

On `app.socialspreadcart.com`, `getCurrentTenant()` (Spec 003) prefers
the active-tenant cookie over the host. The existing subdomain resolver
is still used on tenant public subdomains. All admin pages — dashboard,
quotes list, contacts, team, brand — read the current tenant from the
cookie-preferred helper and pass the resulting `tenantId` into the
services layer.

**Why this priority**: This is the plumbing that makes User Stories 1
and 2 work end-to-end. It's a single edit to `getCurrentTenant()` but
it affects every admin page.

**Independent Test**: With the active-tenant cookie set to B but the
host `app.socialspreadcart.com`, open `/admin/contacts`. Confirm the
list is tenant B's contacts.

**Acceptance Scenarios**:

1. **Given** the request host is `app.socialspreadcart.com` and the
   active-tenant cookie references tenant B, **When**
   `getCurrentTenant()` runs, **Then** it returns tenant B.
2. **Given** the request host is `sarah.socialspreadcart.com` (public),
   **When** `getCurrentTenant()` runs, **Then** it returns the tenant
   resolved by subdomain, ignoring the cookie.
3. **Given** the cookie references a tenant the user does NOT belong
   to, **When** `getCurrentTenant()` runs on the admin host, **Then** it
   falls back to the user's first membership and repairs the cookie.

---

### User Story 4 — Dev Workflow Still Works (Priority: P3)

Local development keeps its existing `*.localhost:3000` convention. The
admin host in dev is `app.localhost:3000`. The `?_tenant=` override from
Spec 003 still works on the admin host for quick smoke tests.

**Why this priority**: So nobody has to fight their dev server.

**Independent Test**: Start the dev server. Open
`http://app.localhost:3000`. Confirm the login page renders. Log in.
Confirm the admin shell renders.

**Acceptance Scenarios**:

1. **Given** the dev server is running, **When** a developer opens
   `http://app.localhost:3000/admin`, **Then** the admin shell renders.
2. **Given** `?_tenant=<uuid>` is appended to any admin URL in dev,
   **Then** that tenant becomes the active tenant for the request.

---

### Edge Cases

- **User with zero tenant memberships**: routed to the "awaiting
  invitation" holding page (Spec 006), not the admin.
- **Stale active-tenant cookie** referring to a deleted or suspended
  tenant: the cookie is cleared and the user is routed through the
  chooser.
- **Deep link to `/admin/quotes/<id>` while the cookie points to a
  different tenant**: the page returns 404 (scoped queries by Spec 004
  naturally return nothing) with a helpful "this item belongs to a
  different tenant; switch?" link.
- **Public subdomains that happen to be `app`**: `app` is a reserved
  slug per Spec 003 and cannot be used as a tenant slug.
- **Custom domains** (future): out of scope for V1. The host resolver is
  written so custom domains can plug in later without touching admin
  routing.

## Requirements

### Functional Requirements

- **FR-001**: The admin shell MUST be accessible at
  `app.socialspreadcart.com` in production and `app.localhost:3000` in
  development.
- **FR-002**: The middleware MUST redirect any `/admin*` path on a
  non-admin host to the same path on the admin host, preserving query
  strings.
- **FR-003**: `getCurrentTenant()` MUST prefer the active-tenant cookie
  on the admin host and the subdomain on tenant public hosts. The
  resolution precedence MUST be documented at the top of the helper.
- **FR-004**: The admin chrome MUST render a tenant switcher when the
  current user has more than one membership. The switcher MUST show the
  active tenant's name and list the others.
- **FR-005**: A `setActiveTenant(tenantId)` Server Action MUST verify
  that the user is a member of the target tenant before mutating the
  cookie, and MUST return a redirect response that reloads the current
  admin path.
- **FR-006**: The tenant switcher MUST be a client component that calls
  the Server Action; no direct cookie writes from the browser.
- **FR-007**: The `app` slug MUST be reserved and rejected by the slug
  validator introduced in Spec 003.
- **FR-008**: All existing `/admin/*` pages MUST function unchanged
  under the new host; moving hosts is a plumbing change, not a rewrite.
- **FR-009**: The public subdomains MUST NOT serve any `/admin*` route.
  The middleware MUST return a 308 redirect to the admin host.
- **FR-010**: The login page MUST be served on the admin host as the
  default landing route, with a fallback link from public pages' footer.

### Key Entities

- **Admin Host**: The tenant-agnostic URL space where administrative
  UIs live. Not modeled in the database; lives in config.
- **Tenant Switcher**: UI component reading from
  `tenant_ids_for_current_user()` via `TenantService.listMyTenants()`
  and writing via the Server Action.

## Success Criteria

- **SC-001**: An owner managing three tenants can log in once, switch
  between all three, and make an edit in each without re-authenticating.
- **SC-002**: Visiting `<tenant>.socialspreadcart.com/admin` always
  redirects to `app.socialspreadcart.com/admin` (verified by middleware
  unit test).
- **SC-003**: Zero admin routes render on public tenant hosts (verified
  by a crawl of the route manifest in a test).
- **SC-004**: `getCurrentTenant()` on the admin host returns the
  cookie-indicated tenant in 100% of cases where the user is a member of
  that tenant.
- **SC-005**: Switching tenants via the switcher reloads the current
  path and swaps the data in under 500ms on a warm dev server.

## Assumptions

- The admin host uses the same deployment as the public hosts; routing
  is handled in middleware rather than via separate Vercel projects.
- Custom domains for individual tenants are NOT in scope. Every tenant
  is served at `<slug>.socialspreadcart.com` and manages itself via
  `app.socialspreadcart.com`.
- The admin shell's styling does NOT use per-tenant brand values by
  default — it is platform-branded. Individual tenant data views MAY
  show brand accents (e.g. the tenant's logo next to their name in the
  switcher), but the chrome itself stays neutral.
- All admin pages already consume the services layer from Spec 004, so
  moving hosts does not require re-plumbing queries.
