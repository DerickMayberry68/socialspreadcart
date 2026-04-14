# Implementation Plan: Auth, Roles & Tenant Membership

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)

## Summary

Complete the multi-tenant auth UX. Introduce `tenant_invitations`, invitation
send/accept flows, role-gated actions via `requireRole()`, and a tenant
chooser for multi-tenant users. Add RLS policies that prevent non-owners
from writing `tenant_users`.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5, Supabase Auth, Resend (via
  `EmailService`), Zod, services layer (Spec 004), brand service (Spec 005).
**Storage**: Supabase — one new table (`tenant_invitations`), one new
  SQL helper (`owner_tenant_ids()`), updated RLS on `tenant_users`.
**Testing**: Vitest. New suite `tests/invitation-flow.test.ts` covering
  createInvite → acceptInvite → role enforcement. Extends Spec 002
  isolation tests with `tenant_invitations` assertions.

## Project Structure

```text
supabase/migrations/
└── 20260420_tenant_invitations.sql   # NEW: table, owner_tenant_ids() helper, RLS for tenant_users writes

src/
├── services/
│   └── invitation-service.ts          # NEW
├── lib/
│   ├── auth/
│   │   └── require-role.ts            # NEW
│   └── tenant/
│       └── active-tenant.ts           # NEW: read/write the active-tenant cookie
└── app/
    ├── login/page.tsx                 # UPDATED: post-auth tenant routing
    ├── accept-invite/page.tsx         # NEW
    ├── choose-tenant/page.tsx         # NEW
    └── admin/
        └── team/
            ├── page.tsx               # NEW: members + pending invites
            └── actions.ts             # NEW: Server Actions for invite / revoke / remove
tests/
└── invitation-flow.test.ts
```

## Constitution Check

| Principle | Result |
| --------- | ------ |
| I. Single Responsibility | Each file one purpose ✅ |
| IV. Interface Segregation | `InvitationService` narrow; auth helper is a one-function module ✅ |
| V. Dependency Inversion | All auth writes via service; no direct Supabase in pages ✅ |
| UX & Brand | Login, chooser, accept-invite pages use tenant brand per Spec 005 ✅ |

## Implementation Order

1. SQL migration: `tenant_invitations`, `owner_tenant_ids()`, RLS for
   `tenant_users` writes.
2. `InvitationService` with create/accept/revoke/list functions.
3. `ActiveTenant` cookie helpers.
4. `requireRole()` helper.
5. `/login` post-auth routing logic (zero/one/many tenant branches).
6. `/choose-tenant` page.
7. `/accept-invite` page.
8. `/admin/team` page + Server Actions.
9. Invitation email template in `EmailService`.
10. Extend test suite; run full `npm test`.
