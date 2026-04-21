---
description: "Planning task list for agency-managed tenant provisioning and custom domains"
---

# Tasks: Agency-Managed Tenant Provisioning & Custom Domains

**Input**: Design documents from `specs/010-agency-managed-tenant-provisioning/`
**Prerequisites**: `spec.md` complete, `plan.md` complete, agreement that this work remains future scope until explicitly scheduled

**Tests**: Not yet applicable for implementation in this phase. This task list is for planning readiness only.

**Organization**: Clarify the business workflow first, then design the
data model, then design host/domain routing, then define implementation
phases for future execution.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel once the prerequisite planning work exists

---

## Phase 1: Business Workflow Clarification

**Purpose**: Lock the operating model before writing product code.

- [ ] T001 Document the exact Studio X onboarding workflow:
  - who creates a tenant
  - when the client gets access
  - what information must exist before launch
  - who owns DNS changes

- [ ] T002 Decide whether the agency workflow will live:
  - inside this repo as a protected `/agency` surface
  - in a Studio X system that calls backend APIs
  - or in a hybrid model

- [ ] T003 Define the role model:
  - Studio X operator permissions
  - tenant owner permissions
  - any platform-admin distinction needed beyond current tenant roles

**Checkpoint**: The business workflow is explicit and no longer assumed.

---

## Phase 2: Data Model Design

**Purpose**: Design the future schema changes without implementing them yet.

- [ ] T004 Design a `tenant_domains`-style table covering:
  - `tenant_id`
  - `hostname`
  - `is_primary`
  - `verification_status`
  - timestamps
  - any verification metadata needed

- [ ] T005 Design launch readiness storage:
  - explicit status enum vs derived readiness
  - optional checklist fields for content, DNS, booking, and approvals

- [ ] T006 Design transactional tenant provisioning requirements:
  - tenant row
  - memberships
  - any default tenant-scoped records
  - rollback behavior

**Checkpoint**: Future migrations can be written from the agreed model.

---

## Phase 3: Routing & Domain Resolution Design

**Purpose**: Extend the current routing model on paper before code changes.

- [ ] T007 Define host-resolution precedence:
  - admin host
  - verified custom domain
  - platform preview subdomain
  - bare legacy domain fallback if still needed

- [ ] T008 Define launch-state behavior for unresolved or unverified domains:
  - what visitors see
  - what agency operators see
  - how misconfigured DNS is surfaced

- [ ] T009 Define canonical host behavior:
  - apex vs `www`
  - redirects
  - preview-to-production behavior

**Checkpoint**: Middleware/domain behavior is fully specified before implementation.

---

## Phase 4: Future Implementation Planning

**Purpose**: Break the future feature into implementation slices.

- [ ] T010 Split future work into milestones:
  - M1 agency-managed tenant provisioning
  - M2 launch-status tracking
  - M3 custom domain mapping
  - M4 DNS verification / operational polish

- [ ] T011 Define the minimum tests required for each milestone:
  - provisioning transaction tests
  - hostname resolution tests
  - cross-tenant safety tests
  - launch-readiness workflow tests

- [ ] T012 Prepare a go/no-go checklist for scheduling implementation:
  - first client launched
  - current tenant launch stabilized
  - domain strategy chosen
  - agency workflow clarified

**Checkpoint**: The feature is ready to move through SpecKit clarify/plan/tasks again when prioritized.

---

## Notes

- This feature is intentionally future-facing.
- SocialSpreadCart remains a shared multi-tenant platform with one
  database, not one database per client.
- Self-serve signup inside SocialSpreadCart is out of scope for this spec.
- The expected future entry point is Studio X's agency workflow on or
  behind `studioxconsulting.com`.
