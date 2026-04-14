# Feature Specification: Auth, Roles & Tenant Membership

**Feature Branch**: `006-auth-roles-tenant-membership`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Build the authentication experience for multi-tenant owners and staff. Each user can belong to multiple tenants with different roles. Owners can invite staff to their tenant. Logging in resolves the user's active tenant. Admin writes to tenant data require the user to be a member with sufficient role."

## Context

Spec 002 created `tenant_users` with a `role` column (`owner`, `admin`,
`staff`). Spec 003 added tenant routing. Spec 004 scoped services. But
the actual **auth UX** — how a user logs in, which tenant they "land" on,
how they switch tenants, how they invite a teammate, how roles gate
actions — is still undefined.

This feature closes the auth loop. It does NOT introduce self-serve
signup (that is Spec 009); it presumes existing auth users exist and
need to be attached to tenants by owners via invitation.

## User Scenarios & Testing

### User Story 1 — Owner Logs In And Lands In Their Tenant (Priority: P1)

An existing user with a single tenant membership logs in at
`app.socialspreadcart.com/login`. On success, they are redirected to
their tenant's admin dashboard. The active tenant is stored in a
session cookie (or derived from `tenant_users` when the user has exactly
one tenant) and drives all subsequent requests.

**Why this priority**: The primary auth flow. Without it, nobody can
administer a tenant.

**Independent Test**: Create a user linked to tenant A via `tenant_users`.
Log in. Confirm redirect to the admin dashboard and that the dashboard
queries return tenant A's data.

**Acceptance Scenarios**:

1. **Given** a user has exactly one `tenant_users` row, **When** they log
   in, **Then** their active tenant is set to that tenant and they are
   redirected to `/admin` (or wherever the tenant admin shell lives).
2. **Given** a user has zero `tenant_users` rows, **When** they log in,
   **Then** they are redirected to an "awaiting invitation" holding page.

---

### User Story 2 — Owner Invites Staff (Priority: P1)

An owner navigates to `/admin/team` and adds a staff member by email. A
`tenant_invitations` row is created with a unique token. An invitation
email (via the existing `EmailService`) sends a link to
`/accept-invite?token=...`. The recipient logs in (or signs up via the
existing Supabase auth flow — self-serve is Spec 009), the invitation is
validated, and a `tenant_users` row is created linking them to the owner's
tenant with the chosen role.

**Why this priority**: Without invitations, tenants cannot have teams.
Every tenant is stuck at "one owner, forever".

**Independent Test**: As owner A, invite `staff@test.local` with role
`staff`. Accept the invitation as that email. Confirm the staff user can
log in and see tenant A's data but cannot access an owner-only action
(like deleting the tenant).

**Acceptance Scenarios**:

1. **Given** an owner on `/admin/team`, **When** they submit an invite
   email and role, **Then** a `tenant_invitations` row is created with
   a unique token, an email is sent, and the new row appears in the team
   list as "pending".
2. **Given** a pending invitation, **When** the recipient opens the
   invitation link and authenticates, **Then** a `tenant_users` row is
   created and the invitation is marked `accepted`.
3. **Given** a pending invitation older than 7 days, **When** the link is
   opened, **Then** the server rejects it as expired.

---

### User Story 3 — Role-Gated Actions (Priority: P2)

Certain admin actions are gated by role:
- `owner`: full access; can delete the tenant, edit brand, invite staff,
  remove members.
- `admin`: full data access but cannot delete the tenant or remove owners.
- `staff`: read + create/update quotes and contacts; no delete; no brand
  or team management.

A helper `requireRole(tenantId, minRole)` runs at the top of protected
pages/actions and 403s if the current user's role does not meet the
requirement.

**Why this priority**: Access control is important but the initial
client scope has a single owner per tenant. Ship this in V1 but not as a
blocker for public launch.

**Independent Test**: Attach user B to tenant A as `staff`. Log in as B.
Attempt to open the `/admin/brand` page. Confirm a 403 response.

**Acceptance Scenarios**:

1. **Given** a staff user, **When** they navigate to `/admin/brand`,
   **Then** the route returns 403 with a clear message.
2. **Given** an owner user, **When** they navigate to `/admin/brand`,
   **Then** they see the page.
3. **Given** an admin user, **When** they attempt to delete the tenant,
   **Then** the action is rejected with 403.

---

### User Story 4 — User With Multiple Tenants Sees A Chooser (Priority: P3)

A user belonging to more than one tenant lands on a tenant chooser after
login instead of being auto-routed. The chooser lists each tenant the
user belongs to with their role, and clicking one sets it as active and
redirects to that tenant's admin shell.

**Why this priority**: A nice-to-have until the platform has power users
managing multiple tenants. Ship but not critical.

**Independent Test**: Attach the same user as `owner` of two tenants. Log
in. Confirm a chooser appears. Click tenant B. Confirm admin queries
return tenant B's data.

**Acceptance Scenarios**:

1. **Given** a user with two `tenant_users` rows, **When** they log in,
   **Then** a tenant chooser page renders listing both tenants.
2. **Given** the chooser is shown, **When** the user clicks tenant B,
   **Then** the active tenant cookie is set to tenant B and the admin
   shell renders tenant B's data.

---

### Edge Cases

- **Invitation to an email that already has an account**: accept flow
  detects the existing user and links them directly.
- **Invitation to an email that does NOT yet have an account**: user goes
  through the Supabase signup flow, then the invitation token is consumed.
- **Owner cannot remove the last owner**: the server rejects any removal
  that would leave the tenant with zero owners.
- **Suspended tenants**: members of a suspended tenant cannot log in to
  that tenant; they are redirected to the awaiting/holding page.
- **Session expiry mid-request**: the middleware's auth guard (Spec 003)
  already handles this by redirecting to `/login`.

## Requirements

### Functional Requirements

- **FR-001**: A `public.tenant_invitations` table MUST exist with:
  `id`, `tenant_id`, `email`, `role`, `token`, `invited_by`, `status`
  (`pending` | `accepted` | `expired` | `revoked`), `expires_at`,
  `created_at`, `accepted_at`.
- **FR-002**: An `InvitationService` MUST expose `createInvite`,
  `acceptInvite`, `revokeInvite`, `listInvitesForTenant`. All
  tenant-scoped per Spec 004.
- **FR-003**: The login flow MUST resolve the user's `tenant_users`
  memberships after a successful auth and route accordingly: zero →
  holding page; one → auto-select; many → chooser.
- **FR-004**: An "active tenant" value MUST be stored in a secure,
  httpOnly cookie and read by `getCurrentTenant()` in admin routes as a
  preference over subdomain resolution (on `app.socialspreadcart.com`,
  the active-tenant cookie drives `x-tenant-id`; on tenant subdomains,
  the subdomain still drives it).
- **FR-005**: A `requireRole(minRole)` server helper MUST exist that
  reads the current user, current tenant, and `tenant_users.role`, then
  throws a 403-rendering error if the role is insufficient.
- **FR-006**: Role precedence: `owner > admin > staff`.
- **FR-007**: `tenant_users` writes (insert, update, delete) MUST be
  gated by RLS policies that require the caller to be `owner` of the
  target tenant. A new helper function `public.owner_tenant_ids()` MUST
  be created for these policies.
- **FR-008**: An `/admin/team` page MUST list members and pending
  invitations, with actions to invite, change role, revoke invitation,
  remove member. Owner-only.
- **FR-009**: An `/accept-invite` route MUST validate the token,
  authenticate the user if needed, create the `tenant_users` row, mark
  the invitation `accepted`, and redirect to the new tenant's admin
  dashboard.
- **FR-010**: The invitation email MUST go through `EmailService` (Spec
  004's refactored version) and MUST be branded with the inviting
  tenant's `tenant_brand` (Spec 005).
- **FR-011**: Invitations MUST expire after 7 days.
- **FR-012**: Removing a member MUST prevent the last owner from being
  removed.

### Key Entities

- **TenantInvitation**: Pending invitation row with token and expiry.
- **Active Tenant (session)**: Cookie-scoped preference used on the
  admin subdomain to disambiguate multi-tenant users.

## Success Criteria

- **SC-001**: A new owner can log in, invite a staff member, have the
  staff member accept and log in, and both users see the correct data
  in under 5 minutes end-to-end.
- **SC-002**: 100% of role-gated actions (brand edit, tenant delete,
  team management) return 403 when called by a staff user.
- **SC-003**: Zero `tenant_users` or `tenant_invitations` writes succeed
  from a non-owner user (verified in an extension of the Spec 002
  isolation test suite).
- **SC-004**: No invitation token is reusable — once `accepted`, the
  same token returns an error.
- **SC-005**: The last-owner protection returns a clear error message
  and never mutates data.

## Assumptions

- Supabase Auth is the identity provider. No custom auth code.
- Invitation emails use the existing `EmailService` (Resend).
- Self-serve signup (a user creating a brand-new tenant from scratch) is
  Spec 009. This feature assumes invitations exist.
- The admin app is at `app.socialspreadcart.com` (Spec 008). This feature
  implicitly assumes that routing but does not depend on it — the active
  tenant cookie works on any host.
- Tenants with zero owners are an illegal state enforced by a DB trigger
  or by the removal helper at the application layer.
