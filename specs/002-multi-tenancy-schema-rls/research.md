# Research: Multi-Tenancy Schema & RLS

**Feature**: 002-multi-tenancy-schema-rls
**Date**: 2026-04-10

## Decision Log

### D-001: Shared-Schema Multi-Tenancy (vs. Schema-Per-Tenant or DB-Per-Tenant)

**Decision**: Shared schema, shared tables, row-level isolation via
`tenant_id` column + PostgreSQL RLS policies.

**Rationale**:
- Supabase projects are a single database; `schema-per-tenant` is operationally
  painful and does not compose with Supabase's generated types, migrations,
  or storage buckets.
- `db-per-tenant` is operationally worst — each tenant is a separate
  Supabase project with its own auth, billing, and migration state.
- Shared-schema RLS is the default multi-tenancy pattern for Supabase and
  is what the official Supabase docs recommend.
- Every other SaaS-ready Postgres stack in the ecosystem (PostgREST, Hasura,
  Prisma) models it the same way.
- The security model relies on one primitive: `auth.uid()` in an RLS policy.
  That is simple to audit.

**Alternatives considered**:
- **Schema-per-tenant**: Rejected — operational nightmare; breaks Supabase
  type generation and CLI tooling.
- **DB-per-tenant**: Rejected — prohibitive cost and complexity at any scale
  beyond ~5 tenants.
- **App-layer only filtering (no RLS)**: Rejected — defence-in-depth
  requires the database itself to enforce isolation. A single forgotten
  `.eq('tenant_id', ...)` in a service would leak data. RLS is the
  backstop.

---

### D-002: Single Helper Function (`tenant_ids_for_current_user`)

**Decision**: Create one SQL helper function that returns the set of tenant
UUIDs the current `auth.uid()` belongs to, and reference it from every
policy.

**Rationale**:
- Without a helper, every policy becomes a subquery like
  `tenant_id in (select tenant_id from tenant_users where user_id = auth.uid())`.
  That works but is verbose and error-prone to copy across six tables and
  four verbs (24 policies).
- A `stable security definer` function lets the planner cache the result
  per-statement and centralises the isolation rule in one place. Changes to
  the rule (e.g., "only active memberships count") are a one-line edit.
- Supabase's own docs recommend this pattern.

**Alternatives considered**:
- **Inline subqueries per policy**: Rejected — verbose, copy-paste error risk,
  harder to audit.
- **Session variable (`current_setting('app.current_tenant_id')`)**: Rejected
  **for this feature** because it requires the request-handling layer to set
  the GUC on every connection. That is Spec 003's job. We will introduce a
  `current_tenant_id()` companion helper in Spec 003 and augment the policies
  then.

---

### D-003: Four RLS Patterns, Not Six

**Decision**: Define four reusable RLS patterns (Tenant-Only, Public Read /
Tenant Write, Public Insert / Tenant Read, Owner-Only) and assign each
business table to exactly one pattern.

**Rationale**:
- Six tables × 4 verbs × ad-hoc SQL = 24 hand-written policies. That is a
  maintenance burden and an audit failure waiting to happen.
- The tables actually fall cleanly into three access shapes in scope (plus
  one reserved for future use). Enumerating the patterns forces consistency
  and makes review trivial: "which pattern does this table use?"
- Tests target patterns as well as tables, so adding a new table in a
  future feature just means "pick a pattern; tests already cover it".

**Patterns are documented in `contracts/rls-policies.md`.**

---

### D-004: Test Strategy — Real Supabase Local, Not Mocks

**Decision**: Run `tests/tenant-isolation.test.ts` against a local Supabase
instance (`supabase start`) using real `@supabase/supabase-js` clients with
real anon and authenticated sessions.

**Rationale**:
- RLS is enforced by PostgreSQL. Mocking `supabase-js` proves nothing about
  RLS behaviour; it only proves the test's own mock.
- The whole point of this feature is to prove cross-tenant isolation is
  impossible at the database layer. The only way to prove that is to issue
  real queries against a real database and observe that the queries return
  zero rows or are rejected.
- Supabase provides `supabase start` locally for exactly this purpose.

**Trade-offs accepted**:
- Tests require a running local Supabase. CI must start one before running
  the suite. That is standard Supabase practice.
- Test suite is slower than unit tests (~30s vs. milliseconds). Acceptable
  for a once-per-CI-run security test.

**Alternatives considered**:
- **Mock `@supabase/supabase-js`**: Rejected — tests prove nothing.
- **In-memory Postgres (`pg-mem`)**: Rejected — does not support RLS.
- **Testcontainers Postgres**: Rejected — duplicates what `supabase start`
  already gives us.

---

### D-005: Vitest As The Test Runner

**Decision**: Use `vitest` 2.x with `environment: 'node'`.

**Rationale**:
- Vitest supports TypeScript out of the box with zero additional config.
- Matches `npm test` convention in the project's `CLAUDE.md`.
- Compatible with Next.js projects without ejecting from SWC.
- Has built-in globals (`describe`, `it`, `expect`) and a minimal config
  surface.

**Alternatives considered**:
- **Jest**: Rejected — slower, requires ESM config gymnastics with Next 15.
- **Node's built-in `node:test`**: Tempting (no new dependency) but lacks
  `expect` ergonomics and parallel test utilities. Worth reconsidering in a
  later feature if we want to drop a dev dependency.
- **Playwright**: Overkill for DB-only tests. Reserved for UI e2e.

---

### D-006: Backfill Strategy — Single Legacy Tenant

**Decision**: Create exactly one tenant row (`slug = 'sarah'`) and backfill
every existing business-domain row to reference it.

**Rationale**:
- Production currently has one business owner, so "legacy tenant" is a
  well-defined bucket.
- Attempting to partition existing rows into multiple tenants at migration
  time is premature — there are no other tenants yet.
- The slug `sarah` is the legacy owner's first name and is what the later
  subdomain-routing spec will use for backward compatibility during cutover.

**Alternatives considered**:
- **Multiple seed tenants**: Rejected — no business need; adds complexity.
- **Null tenant_id for legacy rows**: Rejected — defeats the purpose of
  adding the column. Every row must belong to exactly one tenant.

---

### D-007: Migration Transactionality & Idempotency

**Decision**: Wrap the entire migration in `begin; ... commit;` and guard
every DDL statement with `if not exists` / `if exists` / `create or replace`.

**Rationale**:
- Transactional: a partial failure leaves the schema in its pre-migration
  state. No "half-migrated" database.
- Idempotent: re-running the migration is safe. This matters for local
  development loops (`supabase db reset` followed by editing and re-running)
  and for CI sanity checks.

**Supabase-specific caveat**: Supabase CLI wraps migrations in their own
transaction. The explicit `begin; commit;` is defensive; if the CLI's
wrapper differs in a future version, we still get transactional behaviour.

---

### D-008: `profiles` Stays Non-Tenant-Scoped

**Decision**: `profiles` does NOT get a `tenant_id` column. Tenant membership
is represented exclusively by `tenant_users`.

**Rationale**:
- A user is one row in `auth.users` and one row in `profiles`, regardless of
  how many tenants they belong to.
- Putting `tenant_id` on `profiles` would force either a composite key
  (`user_id + tenant_id`) — breaking the `profiles.id = auth.users.id`
  convention — or duplication (N profiles for N tenants) — breaking
  per-user metadata like email and display name.
- `tenant_users` is the clean membership record.

**Trade-off**: `profiles` RLS must allow authenticated users to read any
profile (or at least any profile in their own tenant_users). The current
policy (`authenticated read profiles using true`) is left as-is for this
feature. Tightening it is deferred to Spec 006 (Auth & Roles).

---

### D-009: `contacts` Per-Tenant Email Uniqueness

**Decision**: Drop the global `contacts_email_idx` unique index on
`lower(email)` and replace it with a per-tenant composite unique index on
`(tenant_id, lower(email))`.

**Rationale**:
- The current index prevents two different tenants from having a customer
  with the same email. That is wrong in a multi-tenant world — customers
  may patronise multiple cart operators.
- The per-tenant composite index preserves the "upsert by email" behaviour
  that Feature 001's `QuoteService` relies on, while scoping uniqueness to
  the correct boundary.

---

### D-010: Storage Buckets Deferred

**Decision**: Storage bucket scoping is NOT addressed in this feature. The
`boards` and `events` buckets remain with their current policies.

**Rationale**:
- Storage RLS is a separate policy surface (`storage.objects`) with its
  own patterns (bucket paths, object metadata).
- Scoping storage correctly requires per-tenant path prefixes and a service
  layer that knows the current tenant to construct paths — both of which
  depend on Spec 003 (request-scoped tenant context) and Spec 004 (services
  layer scoping).
- Deferring to Spec 007 keeps this feature focused on the `public` schema.

**Risk acknowledged**: Until Spec 007 lands, any authenticated user can
upload to/download from any tenant's storage bucket. This is a known gap
and is documented in the multi-tenancy migration plan.
