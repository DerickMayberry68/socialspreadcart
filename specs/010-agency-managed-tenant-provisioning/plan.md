# Implementation Plan: Agency-Managed Tenant Provisioning & Custom Domains

**Branch**: `main` | **Date**: 2026-04-14 | **Spec**: [spec.md](spec.md)

## Summary

Plan a future agency-managed workflow where Studio X provisions new
client tenants inside the existing shared SocialSpreadCart database,
assigns memberships, manages launch readiness, and maps custom client
domains to the correct tenant. This work explicitly replaces ad hoc
manual provisioning over time, but it does not ship now.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5, Supabase, current tenant
  routing/middleware, tenant memberships, Vercel domain infrastructure.
**Storage**: Existing shared Supabase project plus future domain-mapping
  tables and launch-status fields.
**Testing**: Vitest for service / routing logic, integration tests for
  host resolution, manual DNS verification checklist for launch flow.
**Target Platform**: Next.js full-stack app on Vercel, with future
  Studio X agency-facing entry point on or behind `studioxconsulting.com`.
**Constraints**:
- No per-client database creation
- No self-serve signup requirement inside SocialSpreadCart
- Must preserve tenant isolation in a shared database
- Must support both preview subdomains and custom production domains
**Scale/Scope**: Expected future work spans at least one migration, host
  resolution updates, domain-verification logic, agency-facing admin
  pages, and launch-status reporting.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Provisioning, domain mapping, and launch tracking are distinct concerns and should be designed as separate modules | Pass |
| II. Open/Closed | Tenant resolution should be extended to support domain mappings without breaking current subdomain routing | Pass |
| IV. Interface Segregation | Agency provisioning UI should call focused services, not write DB rows directly from components | Pass |
| V. Dependency Inversion | Domain resolution and tenant provisioning should be expressed through services and middleware helpers, not scattered host parsing | Pass |
| UX & Brand | Agency workflow belongs to Studio X; tenant public brand remains tenant-specific | Pass |
| Tech Stack | Fits current stack; no platform reset needed | Pass |

## Project Structure

```text
specs/
└── 010-agency-managed-tenant-provisioning/
    ├── spec.md
    ├── plan.md
    └── tasks.md

future expected implementation areas:

supabase/migrations/
└── 2026xxxx_tenant_domains_and_launch_status.sql

src/
├── services/
│   ├── tenant-service.ts
│   └── domain-service.ts                  # future
├── lib/
│   └── tenant/
│       └── resolve.ts                     # future host/domain resolution updates
└── app/
    ├── agency/                            # future Studio X workflow surface
    └── api/                               # future provisioning / verification endpoints

tests/
├── tenant-resolve.test.ts                 # future domain-mapping coverage
└── agency-provisioning.test.ts            # future
```

## Design Direction

1. Keep SocialSpreadCart as a single shared multi-tenant platform.
2. Treat new-client onboarding as a Studio X operating workflow, not a
   self-serve SocialSpreadCart flow.
3. Add a future tenant-domain mapping layer so custom domains resolve to
   the correct tenant.
4. Support launch operations explicitly: tenant created, content ready,
   DNS pending, verified, live.
5. Preserve preview access on platform subdomains during pre-launch work.

## Implementation Order

1. Add a domain/launch data model:
   - `tenant_domains` (or equivalent) with hostname, tenant_id,
     verification status, primary flag, timestamps.
   - launch-state fields or a dedicated launch-tracking model.
2. Extend tenant resolution:
   - resolve by verified custom domain first
   - fall back to existing subdomain routing for platform-hosted preview
     hosts
   - preserve admin host behavior
3. Add agency-managed provisioning services:
   - create tenant
   - assign agency operator + client owner memberships
   - seed default tenant-scoped records
   - return launch state
4. Add agency-facing workflow surfaces:
   - Studio X operator UI or protected workflow
   - launch checklist / status reporting
   - domain attachment and verification feedback
5. Add verification and safety:
   - unique hostname enforcement
   - transactional tenant provisioning
   - tests for domain resolution and cross-tenant safety

## Open Questions For Later Clarification

1. Should the agency workflow live inside this repo under an `/agency`
   area, or in a separate Studio X app that calls backend endpoints here?
2. Will custom domains be Vercel-managed through APIs, manually
   configured, or a hybrid process?
3. Do we need one primary domain per tenant, or multiple domains /
   aliases from day one?
4. What exact roles distinguish Studio X operators from tenant owners
   inside the current auth model?
5. Should launch readiness be modeled as explicit statuses, derived
   statuses, or a checklist object?
