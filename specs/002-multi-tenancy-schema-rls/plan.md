# Implementation Plan: Multi-Tenancy Schema & Row-Level Security

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-multi-tenancy-schema-rls/spec.md`

## Summary

Convert every business-domain table in the `public` schema from single-tenant to
multi-tenant by adding a `tenant_id` column, backfilling it to a single "legacy"
tenant, enforcing `not null`, and replacing every cosmetic RLS policy with a
tenant-scoped policy. Ship alongside an automated Vitest suite that proves
cross-tenant isolation on every table and every CRUD verb. All work is contained
in a single new Supabase migration file plus a new tests directory — no
application code changes in this feature.

## Technical Context

**Language/Version**: TypeScript 5.6, SQL (PostgreSQL 15 via Supabase)
**Primary Dependencies**: `@supabase/supabase-js` 2.x, `@supabase/ssr` 0.10,
  Zod 4 (types/validation); NEW: `vitest` 2.x + `dotenv` as dev dependencies
**Storage**: Supabase (PostgreSQL). New tables: `tenants`, `tenant_users`. New
  columns: `tenant_id` on six existing business-domain tables. New function:
  `public.tenant_ids_for_current_user()`.
**Testing**: Vitest — runs against a local Supabase instance using the anon key
  and a pair of real authenticated users seeded per-suite. Service-role key is
  used only for setup/teardown, never for the isolation assertions themselves.
**Target Platform**: Supabase Postgres (local + hosted); Node 20+ for the test
  runner.
**Project Type**: Web application (Next.js full-stack) — this feature is a
  database + tests feature with no app-code changes.
**Performance Goals**: Migration runs on production data volume (~hundreds of
  rows) in under 5 seconds. Test suite completes in under 30 seconds.
**Constraints**: Migration MUST be transactional and idempotent; MUST NOT break
  Feature 001; MUST NOT change `auth.users` or any schema outside `public`.
**Scale/Scope**: 1 new SQL migration, 1 new Vitest test file, 1 new test helper
  file, 1 `package.json` update (vitest + test script), 1 new `vitest.config.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Migration file does only schema+RLS; test file does only isolation verification; no component changes | ✅ |
| II. Open/Closed | New RLS patterns are additive; existing tables extended with columns, not forked | ✅ |
| III. Liskov Substitution | Generated Supabase types will be regenerated so all callers see the new `tenant_id` contract; Zod schemas updated in Spec 004 | ⚠ Partial — type regeneration is a task in this spec; no caller changes yet |
| IV. Interface Segregation | No service interface changes — services layer is Spec 004's scope | ✅ |
| V. Dependency Inversion | No new SDK boundaries; no component or page touches Supabase directly | ✅ |
| UX & Brand | No UI changes | N/A |
| Tech Stack | Pinned versions respected; `vitest` added as dev dependency — does not affect runtime stack | ✅ |
| Services Mandate | No new services; no bypasses added | ✅ |

**Pre-implementation action required**: None. This feature intentionally avoids
changing any service or component code. Spec 004 will update the services layer
to explicitly pass `tenant_id` and will bring the code into full constitution
compliance with the new multi-tenant contract.

## Project Structure

### Documentation (this feature)

```text
specs/002-multi-tenancy-schema-rls/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions (RLS patterns, helper function, test strategy)
├── data-model.md        # Tenant + TenantUser entities; per-table policy mapping; SQL sketches
├── quickstart.md        # Apply + rollback + verification checklist
├── contracts/
│   └── rls-policies.md      # The four RLS patterns in detail + per-table assignment
└── checklists/
    └── requirements.md      # Spec quality checklist
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    └── 20260410_multi_tenancy.sql     # NEW: tenants, tenant_users, tenant_id columns, backfill, RLS rewrite

tests/
├── tenant-isolation.test.ts           # NEW: Vitest suite covering all 6 tables × 4 verbs
└── helpers/
    └── tenant-test-harness.ts         # NEW: seed/teardown helper (creates 2 tenants, 2 users)

vitest.config.ts                       # NEW: test runner config (environment: node, setupFiles)
package.json                           # UPDATED: add vitest dev dep, "test": "vitest run" script
.env.test.example                      # NEW: documents env vars required for running tests
```

**Structure Decision**: All schema changes go into a single new migration file
under `supabase/migrations/`. All tests go into a new `tests/` directory at the
repo root (there is no existing `tests/` directory — this feature introduces
the convention). No changes anywhere in `src/` for this feature.

## Complexity Tracking

> No constitution violations requiring justification. The partial Liskov
> mark in the Constitution Check is a deliberate sequencing choice: type
> regeneration happens in this feature, but caller updates to honour the new
> contract are batched into Spec 004 to keep this spec focused on the
> database boundary.

## Phase 0: Research

See [research.md](research.md) — all decisions resolved. Key findings:

- **RLS Helper**: a single SQL function `public.tenant_ids_for_current_user()`
  is simpler than per-table `auth.uid()` subqueries and centralises the
  isolation rule.
- **Four RLS Patterns** cover every table in scope; the mapping is in
  `contracts/rls-policies.md`.
- **Test Strategy**: use the real Supabase local instance (`supabase start`)
  with two seeded auth users, not mocks. Mocks cannot prove RLS correctness.
- **Vitest** is the right test runner: Node-native, minimal config, supports
  TypeScript out of the box, and matches the "`npm test`" convention.

## Phase 1: Design & Contracts

See:

- [data-model.md](data-model.md) — Tenant and TenantUser entities; per-table
  `tenant_id` column definition; policy pattern assignment per table.
- [contracts/rls-policies.md](contracts/rls-policies.md) — the four RLS
  patterns (Tenant-Only, Public Read / Tenant Write, Public Insert / Tenant
  Read, Owner-Only) with the exact SQL for each.
- [quickstart.md](quickstart.md) — apply, verify, roll back.

### Post-Design Constitution Re-check

✅ All principles satisfied by the design. No new service boundaries, no new
SDK calls, no UI changes. The partial Liskov mark is acknowledged and
sequenced into Spec 004.

## Implementation Order

1. **Draft the SQL migration** (`supabase/migrations/20260410_multi_tenancy.sql`)
   following the structure in `data-model.md`:
   1. `begin;`
   2. Create `tenants` table
   3. Create `tenant_users` table with composite unique index
   4. Insert legacy tenant row (`slug = 'sarah'`)
   5. Add `tenant_id uuid` column (nullable) to each of the six business tables
   6. Backfill `tenant_id = <legacy>` on every row in every business table
   7. `alter column tenant_id set not null` and add FK constraint
   8. Create `tenant_ids_for_current_user()` helper function
   9. Drop every existing `using (true)` policy on business tables
   10. Create new tenant-scoped policies per the contract
   11. Insert `tenant_users` rows for every existing `profiles.role = 'admin'`
   12. `commit;`

2. **Add `vitest` + `dotenv` dev dependencies** to `package.json` and add
   `"test": "vitest run"` script. Create `vitest.config.ts` with
   `environment: 'node'` and a setup file that loads `.env.test`.

3. **Write the test harness** (`tests/helpers/tenant-test-harness.ts`):
   - Uses the service-role key to create two tenants, two auth users, and
     seed one row per business-domain table per tenant.
   - Exposes `setup()` and `teardown()` helpers that return the tenant IDs,
     user IDs, and per-tenant anon+authenticated Supabase clients.

4. **Write the isolation test suite** (`tests/tenant-isolation.test.ts`):
   - `beforeAll`: call harness `setup()`.
   - `afterAll`: call harness `teardown()`.
   - For each of the six business-domain tables, add a describe block with
     four tests covering `select`, `insert`, `update`, `delete` cross-tenant
     attempts. Target ≥ 24 assertions.
   - Additional tests: public anonymous `select` on `menu_items`, `events`,
     `testimonials` is tenant-scoped; public anonymous `insert` on `quotes`
     respects the `with check` clause.

5. **Run the suite locally** against `supabase start`. Fix any failing
   assertions by correcting the migration, not by weakening the tests.

6. **Regenerate Supabase TypeScript types** (if the project has a generated
   types file — check first). If not, add a task to Spec 004 noting that the
   generated type file will be introduced with the services scoping work.

7. **Run Feature 001 quickstart** (`specs/001-booking-quote-form/quickstart.md`)
   end-to-end against the migrated database. Confirm nothing regressed.

8. **Document the rollback procedure** in `quickstart.md`.
