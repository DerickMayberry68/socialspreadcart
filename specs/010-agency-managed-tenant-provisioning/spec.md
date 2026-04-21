# Feature Specification: Agency-Managed Tenant Provisioning & Custom Domains

**Feature Branch**: `010-agency-managed-tenant-provisioning`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "I will onboard future clients through my `studioxconsulting.com` agency site, not through self-serve signup inside SocialSpreadCart. SocialSpreadCart remains a shared multi-tenant platform, and later we need a planned way to provision new tenants, assign ownership, launch client domains, and manage DNS/domain mapping without creating a new database per client."

## Context

SocialSpreadCart is already structured as a shared multi-tenant
application: a single Supabase project, shared schema, tenant-scoped
tables, tenant memberships, and tenant-aware routing. That is the right
architecture for an agency-managed platform. What is still missing is a
formal, future-proof operating model for how Studio X creates and launches
new client tenants.

The current product priority is to get the first client live, edit copy,
configure the production domain, and start accepting bookings. Self-serve
signup and in-app onboarding are intentionally deferred. When the time
comes, new tenant provisioning should happen through Studio X's agency
workflow, likely initiated from `studioxconsulting.com`, while
SocialSpreadCart remains the shared delivery platform behind the scenes.

This feature defines that future model before any implementation work:

1. Studio X provisions new tenants through an agency-controlled workflow.
2. A new client becomes a new `tenants` row plus related tenant-scoped
   data and memberships, not a new database.
3. Each tenant can eventually map one or more custom domains to the shared
   app.
4. Tenant launch must cover both application state and external DNS state.

This spec is intentionally planning-focused. It does not ship now; it
exists so the team can later clarify, plan, task, and implement the work
without rediscovering foundational decisions.

## User Scenarios & Testing

### User Story 1 - Agency Creates A New Tenant (Priority: P1)

A Studio X operator creates a new client workspace from an agency-managed
interface or back-office workflow. The system creates a `tenants` row,
assigns one or more `tenant_users` memberships, seeds default tenant
content/brand records, and returns the tenant in a launch-ready draft
state.

**Why this priority**: This is the foundation for all future client
onboarding. Without a reliable tenant-provisioning workflow, every new
client launch remains an ad hoc database operation.

**Independent Test**: From the agency workflow, create a tenant for
`Client A` with slug `client-a`. Confirm:
- a `tenants` row exists
- at least one `tenant_users` row exists with `role = 'owner'`
- default per-tenant records required by the app exist
- the tenant can be opened in the admin app

**Acceptance Scenarios**:

1. **Given** a Studio X operator with agency-level access, **When** they
   submit a new-client provisioning form, **Then** the app creates a new
   tenant and required memberships in the shared database.
2. **Given** a requested slug is already in use or reserved, **When** the
   provisioning form submits, **Then** the system rejects the request with
   a clear validation error.
3. **Given** tenant provisioning fails mid-flight, **When** the request
   completes, **Then** no partial tenant is left in a broken state.

---

### User Story 2 - Agency Launches The Client On A Real Domain (Priority: P1)

After provisioning, Studio X associates the tenant with a production
domain. The platform resolves incoming requests for that domain to the
correct tenant, even though all tenants still run on the same deployment.

**Why this priority**: Agency launches require client-friendly production
domains. Subdomains under the platform domain may be acceptable during
drafting, but production launch often requires a client-owned domain.

**Independent Test**: Associate `www.client-a.com` with tenant `client-a`,
point DNS to the shared deployment, load the site, and confirm all public
routes resolve to the right tenant.

**Acceptance Scenarios**:

1. **Given** a tenant has a verified custom domain, **When** a visitor
   requests that domain, **Then** the middleware resolves the request to
   the mapped tenant instead of using subdomain parsing.
2. **Given** a domain is attached to tenant A, **When** tenant B is
   requested through its own domain, **Then** no cross-tenant leakage is
   possible.
3. **Given** a domain is not yet verified or DNS is incomplete, **When**
   Studio X views launch status, **Then** the system clearly indicates the
   domain is not ready for public launch.

---

### User Story 3 - Studio X Tracks Launch Readiness (Priority: P2)

A Studio X operator can see whether a tenant is still in draft, ready for
review, DNS pending, verified, or live. Launch work is visible as an
operational workflow rather than scattered manual notes.

**Why this priority**: New-client launches involve copy, approvals, DNS,
branding, and booking checks. The platform needs a light operating model
for these handoffs.

**Independent Test**: For a provisioned tenant, mark content ready, attach
domains, verify DNS, and confirm the launch status reflects progress end
to end.

**Acceptance Scenarios**:

1. **Given** a tenant has no mapped production domain, **When** Studio X
   views the tenant, **Then** the tenant is marked pre-launch or draft.
2. **Given** a domain is mapped but DNS is not yet valid, **When** the
   tenant is viewed, **Then** the launch status shows DNS pending.
3. **Given** booking and public routes are verified, **When** Studio X
   marks the tenant live, **Then** the tenant is treated as launched in
   the agency workflow.

---

### User Story 4 - Future Client Access Fits Agency Ownership (Priority: P3)

Studio X remains the owning agency and can create tenants, attach domains,
and hand off day-to-day editing access to client operators without giving
them platform-level control over other tenants.

**Why this priority**: Agency ownership is the long-term business model.
The access model must support both Studio X operators and client-specific
users.

**Independent Test**: Create a tenant, assign a Studio X operator and a
client owner, then confirm each sees only the tenants and controls
appropriate to their role.

**Acceptance Scenarios**:

1. **Given** a Studio X operator provisions a tenant, **When** they later
   invite the client owner, **Then** the client gains access only to that
   tenant.
2. **Given** the same Studio X operator manages multiple client tenants,
   **When** they sign in, **Then** they can switch among those tenants in
   the shared admin shell.
3. **Given** a client owner signs in, **When** they access admin, **Then**
   they cannot see or mutate any agency-only or cross-tenant controls.

## Edge Cases

- **No new database per client**: provisioning a new client MUST create
  tenant-scoped records in the existing shared database, never a new
  Supabase project or database instance.
- **Client domain conflicts**: a domain MUST NOT be attached to more than
  one tenant at a time.
- **Apex + www handling**: the domain model must support both
  `client.com` and `www.client.com`, including canonical redirect rules.
- **Temporary launch URLs**: a tenant may need to use a platform subdomain
  while DNS is being prepared for the final custom domain.
- **Agency-controlled launch timing**: a tenant may be provisioned and
  editable before its public domain is live.
- **Multiple domains per tenant**: future support may require primary and
  secondary domains, preview domains, or campaign aliases.
- **Domain transfer or client offboarding**: detaching domains must not
  break other tenants on the shared deployment.
- **Email and booking URLs**: tenant-specific emails, quote links, and
  booking links must eventually align with the primary domain.

## Requirements

### Functional Requirements

- **FR-001**: New client onboarding MUST be modeled as creating a tenant in
  the shared SocialSpreadCart database, not provisioning a new database.
- **FR-002**: The future agency workflow MUST create a `tenants` row and at
  least one `tenant_users` row with `role = 'owner'` in a single
  transactional operation.
- **FR-003**: The workflow MUST validate tenant slugs against the same
  reserved-slug and format rules already enforced for the platform.
- **FR-004**: The future implementation MUST support Studio X initiating
  tenant provisioning from an agency-controlled workflow, expected to live
  on or behind `studioxconsulting.com`.
- **FR-005**: The platform MUST support a future `tenant_domains`-style
  mapping between hostnames and tenants so production requests can resolve
  tenants by custom domain as well as by subdomain.
- **FR-006**: Each mapped custom domain MUST belong to exactly one tenant.
- **FR-007**: The system MUST preserve support for platform-hosted preview
  domains or subdomains while a client domain is still in setup.
- **FR-008**: The future implementation MUST provide a launch-readiness
  model that at minimum distinguishes draft, DNS pending, verified, and
  live states.
- **FR-009**: Studio X operators MUST be able to provision and launch
  tenants without giving cross-tenant control to client operators.
- **FR-010**: The implementation MUST not rely on manual SQL edits as the
  long-term onboarding workflow; the workflow must eventually be surfaced
  through an agency-managed app flow or admin tool.

### Key Entities

- **Tenant Provisioning Request**: the agency-controlled action that
  creates a new tenant, memberships, and default records.
- **Tenant Domain Mapping**: a future table or model that maps a hostname
  to a tenant and tracks verification / launch state.
- **Launch Status**: tenant-level operational status describing whether the
  tenant is draft, DNS pending, verified, or live.
- **Agency Operator**: a Studio X user who can create and launch tenants.

## Success Criteria

- **SC-001**: A new client can be provisioned in the shared database
  without any manual database row editing.
- **SC-002**: A client production domain can be mapped to the correct
  tenant without affecting any other tenant on the shared deployment.
- **SC-003**: Studio X can see whether each tenant is draft, DNS pending,
  verified, or live from a single agency workflow.
- **SC-004**: Client operators only ever gain access to their own tenant.
- **SC-005**: The future onboarding workflow fits the business model of
  Studio X as the owning agency rather than treating SocialSpreadCart as a
  self-serve SaaS from day one.

## Assumptions

- The immediate priority remains launching the first tenant, not building
  agency provisioning yet.
- SocialSpreadCart continues to run as a single shared multi-tenant
  application backed by one Supabase project.
- Self-serve prospect signup inside SocialSpreadCart is explicitly out of
  scope for this feature.
- `studioxconsulting.com` is the intended agency-facing entry point for the
  future provisioning workflow.
- Custom domain routing is a future platform capability and may require
  Vercel/domain-verification infrastructure work in addition to app code.
- Existing tenant slug routing remains useful for preview, staging, or
  pre-launch access even after custom domains are introduced.
