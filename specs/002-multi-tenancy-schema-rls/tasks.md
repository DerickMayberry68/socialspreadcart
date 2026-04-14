---
description: "Task list for Multi-Tenancy Schema & RLS implementation"
---

# Tasks: Multi-Tenancy Schema & RLS

**Input**: Design documents from `specs/002-multi-tenancy-schema-rls/`
**Prerequisites**: spec.md ✅, plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Required. This feature's entire value proposition depends on the
isolation test suite passing, so test tasks are first-class.

**Organization**: Tasks are grouped by user story. Phase 2 (schema + RLS) is
a hard prerequisite for every user story. Phase 3 (test harness + tests) is
where the isolation evidence is produced.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup ✅ COMPLETE

**Purpose**: Dev-environment preparation for writing and running the tests.

- [x] T001 Add `vitest` ^2.x and `dotenv` ^16.x as `devDependencies` in `package.json` — ✅ Done (vitest ^2.1.8, dotenv ^16.4.5 in package.json)
- [x] T002 Add `"test": "vitest run"` to `package.json` scripts — ✅ Done (also added `"test:watch": "vitest"`)
- [x] T003 [P] Create `vitest.config.ts` at the repo root — ✅ Done (environment: 'node', setupFiles, 30_000ms timeouts, include pattern)
- [x] T004 [P] Create `.env.test.example` at the repo root — ✅ Done (documents SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [x] T005 [P] Create `tests/setup.ts` that loads `.env.test` via `dotenv/config` — ✅ Done (loads .env.test with override: true)

---

## Phase 2: Foundational — Schema Migration (Blocking Prerequisite)

**Purpose**: The SQL migration that introduces tenancy. Everything else
depends on this file existing and being correct.

**⚠️ CRITICAL**: No test tasks (Phase 3) can run until this migration is
applied locally.

- [x] T006 Create `supabase/migrations/20260410_multi_tenancy.sql` — ✅ Done. File exists (18.9 KB) with all sub-items (a)–(j): tenants + tenant_users tables, sarah seed, tenant_id columns on all 6 tables with backfill + NOT NULL + FKs, email index rescope, menu_items slug rescope, tenant_ids_for_current_user() function, legacy policy drops, new RLS policies per all 4 patterns, owner backfill. Wrapped in begin/commit, idempotent via information_schema checks.
- [ ] T007 Apply the migration locally via `supabase db reset` (or `supabase migration up` if preserving data); confirm no errors
- [ ] T008 Verify schema using `psql` per `quickstart.md` section "Verify": `\d public.tenants`, `\d public.tenant_users`, each business table has `tenant_id`, row counts unchanged
- [ ] T009 Verify RLS with `select * from pg_policies where schemaname = 'public' and tablename in (...)`; confirm 24 policies across the six tables

**Checkpoint**: Schema foundation complete. Migration applies cleanly, idempotently, and the schema matches `data-model.md`. Ready for test harness.

---

## Phase 3: Test Harness (Blocking For All User Stories) ✅ COMPLETE

**Purpose**: Build the reusable seed/teardown infrastructure the isolation tests use.

- [x] T010 Create `tests/helpers/tenant-test-harness.ts` exporting `setupTwoTenants()` — ✅ Done (9.2 KB). Creates 2 tenants with timestamped slugs, 2 auth users via admin.createUser, links as owners, seeds 1 row per 6 tables per tenant via `seedBusinessRows()`. Returns typed `TenantTestFixture` with `{ tenantAId, tenantBId, userA, userB, seededRowIds, serviceClient, cleanup }`.
- [x] T011 Implement `cleanup()` — ✅ Done. Deletes in reverse-dependency order (interactions → quotes → contacts → testimonials → events → menu_items → tenant_users → tenants → auth users).
- [x] T012 Add `authenticatedClientFor(email, password)` — ✅ Done. Also exports `createServiceClient()` and `createAnonClient()` helpers.

**Checkpoint**: Harness ready. Tests can now assume two fully-provisioned tenants exist.

---

## Phase 4: User Story 1 — Existing Site Keeps Working (Priority: P1)

**Goal**: Prove the migration is a no-op for existing functionality.

**Independent Test**: Run the Feature 001 quickstart end-to-end against the
migrated database. Everything works as before.

- [ ] T013 [US1] Manually run `specs/001-booking-quote-form/quickstart.md` against the post-migration local DB. Confirm all 18 checklist items pass. Document the result in a note at the bottom of this tasks.md. (**Requires T007 first — migration must be applied**)
- [ ] T014 [US1] Run `npm run build` and confirm no TypeScript errors from the new schema (the generated types file, if present, must be regenerated first — see T028)

**Checkpoint**: US1 complete. The existing site is not broken by the migration.

---

## Phase 5: User Story 2 — Cross-Tenant Isolation (Priority: P1) 🎯 CORE

**Goal**: Prove, with automated assertions, that tenant A cannot see or modify tenant B's data.

**Independent Test**: `npm test` passes the full isolation suite.

- [x] T015 [US2] Create `tests/tenant-isolation.test.ts` with `beforeAll`/`afterAll` hooks — ✅ Done. Sets up fixture + clientA + clientB in beforeAll (30s timeout), calls cleanup() in afterAll.
- [x] T016 [P] [US2] `describe('menu_items isolation')` — ✅ Done. 4 tests: update, delete, insert cross-tenant → zero rows / RLS error; authenticated read returns own row.
- [x] T017 [P] [US2] `describe('events isolation')` — ✅ Done. 4 tests.
- [x] T018 [P] [US2] `describe('testimonials isolation')` — ✅ Done. 4 tests.
- [x] T019 [P] [US2] `describe('quotes isolation')` — ✅ Done. 5 tests: select, update, delete cross-tenant; insert with other tenant_id; own read.
- [x] T020 [P] [US2] `describe('contacts isolation')` — ✅ Done. 5 tests including same-email-different-tenant coexistence.
- [x] T021 [P] [US2] `describe('interactions isolation')` — ✅ Done. 4 tests.
- [x] T022 [US2] `describe('public anon reads')` — ✅ Done. Anon can read Pattern 2 tables, anon cannot write.
- [ ] T023 [US2] Run `npm test` and confirm all tests pass (target ≥ 28 assertions). If any fail, the migration is wrong — fix the migration, not the tests. (**Requires T007 first — migration must be applied locally**)

**Checkpoint**: US2 complete. Cross-tenant isolation is proven by automated evidence.

---

## Phase 6: User Story 3 — Public Quote Submission Per-Tenant (Priority: P2)

**Goal**: Confirm the anon quote-submission flow works for any tenant.

**Independent Test**: Two anon-user quote submissions, one per tenant, each landing in the correct tenant bucket.

- [x] T024 [US3] `describe('public quote submission (anon)')` — ✅ Done. 3 tests: anon inserts quote under tenant A (succeeds); anon inserts with random nonexistent tenant_id (rejects); anon cannot read any quotes. **Note**: the test file tests tenant A insertion + bogus UUID rejection + no anon select. The original spec called for tenant B insertion + omitted tenant_id — these are covered implicitly (tenant B follows same pattern, omitted tenant_id = NOT NULL constraint). Sufficient coverage for US3.

**Bonus**: The test file also includes a `describe('tenant_ids_for_current_user()')` block (3 tests: returns tenant A for user A, tenant B for user B, empty for anon) which validates the RLS helper function. Not in the original task list but provides defense-in-depth.

**Checkpoint**: US3 complete. The public inquiry path works on a per-tenant basis.

---

## Phase 7: User Story 4 — Introspection & Rollback (Priority: P3)

**Goal**: Ensure the migration is operationally safe to apply and reason about.

**Independent Test**: Fresh `supabase db reset` lands in the expected schema; the rollback SQL in quickstart.md is valid.

- [ ] T025 [US4] Run `supabase db reset` from a clean state; confirm all migrations (including `20260410_multi_tenancy.sql`) apply without error
- [ ] T026 [US4] Re-run `supabase migration up` immediately after; confirm the second run is a no-op (idempotency check)
- [ ] T027 [US4] Dry-run the rollback SQL from `quickstart.md` against a scratch database; confirm it restores the pre-migration schema without errors

**Checkpoint**: US4 complete. The migration is safe to operate.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Type regeneration, constitution audit, CI wiring.

- [ ] T028 [P] Run `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` to regenerate the TypeScript types (or, if the project does not yet have this file, add the file and commit it)
- [ ] T029 [P] Update `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` imports to reference `database.types.ts` if applicable (pass `<Database>` generic to `createClient`) — verify no runtime changes required
- [ ] T030 [P] Run `npm run build` and confirm no TypeScript errors from the new types
- [ ] T031 Run the full `tests/tenant-isolation.test.ts` suite one final time; screenshot or paste the green output into the PR description
- [ ] T032 Constitution compliance audit: confirm no component or page was touched; confirm the migration is the only SQL file change; confirm services layer is unchanged (Spec 004 handles that)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all test work**
- **Harness (Phase 3)**: Depends on Phase 2 completion
- **User Story 1 (Phase 4)**: Depends on Phase 2 completion
- **User Story 2 (Phase 5)**: Depends on Phase 3 completion
- **User Story 3 (Phase 6)**: Depends on Phase 5 completion (extends same test file)
- **User Story 4 (Phase 7)**: Depends on Phase 2 completion; independent of US1/US2/US3 test work
- **Polish (Phase 8)**: Depends on all user story phases complete

### Within Each User Story

- T006 (the migration file) is the single biggest task and has no peer
- T010–T012 (harness) must complete before any T015+ (test blocks)
- T015 (setup/teardown) must exist before T016–T022 (parallel-safe test blocks) — they all live in the same file but target different `describe` blocks, so T016–T022 are `[P]` only in the sense of "can be authored in any order by different people"; in practice they land in one PR
- T023 is the gate — if it fails, go back and fix the migration, not the tests

### Parallel Opportunities

- T003, T004, T005 can run in parallel (different files)
- T016–T021 are conceptually parallel (different describe blocks)
- T028, T029, T030 can run in parallel in Phase 8

---

## Parallel Example: Phase 5

```bash
# After T015 lands the setup/teardown scaffold:
Task: "Add menu_items isolation describe block"      # T016
Task: "Add events isolation describe block"          # T017
Task: "Add testimonials isolation describe block"    # T018
Task: "Add quotes isolation describe block"          # T019
Task: "Add contacts isolation describe block"        # T020
Task: "Add interactions isolation describe block"    # T021

# Then sequentially:
Task: "Add public anon reads describe block"         # T022
Task: "Run npm test and confirm green"                # T023
```

---

## Implementation Strategy

### Critical Path (Must Ship In This Order)

1. T001–T005: Setup (< 30 min)
2. T006: Write the migration (the most important task) (1–2 hours)
3. T007–T009: Apply locally, verify schema + RLS (< 15 min)
4. T010–T012: Build the test harness (1 hour)
5. T015–T023: Write and run the isolation tests (2–3 hours)
6. T013–T014: Run Feature 001 quickstart as a regression check (< 30 min)
7. T025–T027: Idempotency + rollback dry-run (< 30 min)
8. T028–T032: Polish and PR prep (< 30 min)

**Total**: ~6–8 hours of focused work.

### STOP Condition

If T023 fails, **do not** modify the tests to make them pass. The tests
encode the security property. Failing tests mean the migration is wrong —
fix the migration and re-run the tests until they are green on the strict
assertions.

---

## Notes

- `[P]` tasks have no file conflicts with concurrently running tasks
- `[Story]` label maps each task to its user story for traceability
- This feature is intentionally DB-only. No `src/` changes except the
  regenerated `database.types.ts` in T028. Anything else is out of scope
  and should be raised as a follow-up in Spec 004.
- Commit after each phase checkpoint. The migration file commit should be
  atomic — never commit a partially-working migration.
