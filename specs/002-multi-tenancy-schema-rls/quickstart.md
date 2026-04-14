# Quickstart: Multi-Tenancy Schema & RLS

**Feature**: 002-multi-tenancy-schema-rls
**Date**: 2026-04-10

## Apply The Migration

### Local Development

```bash
# Start Supabase locally
supabase start

# Apply all migrations (the new 20260410_multi_tenancy.sql will run last)
supabase db reset

# OR, if you want to keep existing data, apply only new migrations:
supabase migration up
```

Confirm the migration ran:

```bash
supabase db remote list    # if using a remote project
# OR for local:
psql "$SUPABASE_DB_URL" -c "\d public.tenants"
psql "$SUPABASE_DB_URL" -c "\d public.tenant_users"
psql "$SUPABASE_DB_URL" -c "select slug, name, status from public.tenants;"
```

You should see:
- `public.tenants` table exists
- `public.tenant_users` table exists
- One row in `tenants`: `sarah | The Social Spread Cart | active`

### Hosted (Production) Project

```bash
supabase db push
```

Before running against production:
1. Take a database snapshot via the Supabase dashboard.
2. Run the migration against a staging project first.
3. Run `tests/tenant-isolation.test.ts` against staging.
4. Only then push to production.

---

## Verify

### 1. Schema Check

- [ ] `public.tenants` exists with one row (`slug = 'sarah'`)
- [ ] `public.tenant_users` exists with at least one row per `profiles.role = 'admin'`
- [ ] `menu_items`, `events`, `quotes`, `testimonials`, `contacts`, `interactions`
      each have a `tenant_id uuid not null` column with an FK to `public.tenants(id)`
- [ ] Every existing row in those six tables has `tenant_id` pointing to the
      legacy tenant
- [ ] `public.tenant_ids_for_current_user()` function exists and is marked
      `stable security definer`

### 2. RLS Check

```sql
-- Should return 1 policy for anon select, plus 3 for authenticated
-- insert/update/delete, per each of menu_items / events / testimonials
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('menu_items','events','testimonials','quotes','contacts','interactions')
order by tablename, cmd, policyname;
```

Confirm every policy references `tenant_ids_for_current_user()` except for
the public `select` policies on `menu_items`/`events`/`testimonials` and the
public `insert` policy on `quotes`.

### 3. Existing Site Still Works (Feature 001)

Run the Feature 001 quickstart end-to-end:

```bash
npm run dev
```

- [ ] Navigate to `http://localhost:3000/contact`
- [ ] Submit a test quote
- [ ] Confirm it appears in `/admin/quotes` with correct data
- [ ] Confirm `menu_items` still render on `/menu`
- [ ] Confirm `events` still render on `/events`
- [ ] Confirm `testimonials` still render on the home page

### 4. Tenant-Isolation Tests Pass

```bash
# Install dev dependencies (first time only)
npm install --save-dev vitest@^2 dotenv@^16

# Run the suite
npm test
```

Expected output: `tests/tenant-isolation.test.ts` green with ≥ 24
assertions covering all six tables × four verbs, plus anon-read and
anon-insert edge cases.

- [ ] All tests pass
- [ ] Suite completes in under 30 seconds

---

## Environment Variables (for tests)

Create `.env.test` at the repo root (copy from `.env.test.example`):

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<local anon key from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<local service role key from supabase start output>
```

These are the local Supabase keys. Do NOT commit them — they are in
`.gitignore` via the existing `.env*` pattern.

---

## Rollback Procedure

> Rollback is a **manual emergency procedure**, not a committed migration.
> Apply this SQL manually via `psql` or the Supabase SQL editor if the
> migration causes a production incident that cannot be fixed forward.

```sql
begin;

-- 1. Drop new tenant-scoped policies (list all of them)
drop policy if exists "menu_items_public_select" on public.menu_items;
drop policy if exists "menu_items_tenant_insert" on public.menu_items;
drop policy if exists "menu_items_tenant_update" on public.menu_items;
drop policy if exists "menu_items_tenant_delete" on public.menu_items;

drop policy if exists "events_public_select" on public.events;
drop policy if exists "events_tenant_insert" on public.events;
drop policy if exists "events_tenant_update" on public.events;
drop policy if exists "events_tenant_delete" on public.events;

drop policy if exists "testimonials_public_select" on public.testimonials;
drop policy if exists "testimonials_tenant_insert" on public.testimonials;
drop policy if exists "testimonials_tenant_update" on public.testimonials;
drop policy if exists "testimonials_tenant_delete" on public.testimonials;

drop policy if exists "quotes_public_insert" on public.quotes;
drop policy if exists "quotes_tenant_select" on public.quotes;
drop policy if exists "quotes_tenant_update" on public.quotes;
drop policy if exists "quotes_tenant_delete" on public.quotes;

drop policy if exists "contacts_tenant_select" on public.contacts;
drop policy if exists "contacts_tenant_insert" on public.contacts;
drop policy if exists "contacts_tenant_update" on public.contacts;
drop policy if exists "contacts_tenant_delete" on public.contacts;

drop policy if exists "interactions_tenant_select" on public.interactions;
drop policy if exists "interactions_tenant_insert" on public.interactions;
drop policy if exists "interactions_tenant_update" on public.interactions;
drop policy if exists "interactions_tenant_delete" on public.interactions;

-- 2. Restore the original "cosmetic" policies
create policy "Public read menu_items" on public.menu_items for select using (true);
create policy "Authenticated write menu_items" on public.menu_items for all to authenticated using (true) with check (true);
-- ... (rest of the original policies per 20260407_initial_schema.sql and 20260408_crm_and_auth.sql)

-- 3. Drop the tenant_id FK + column on each business table
alter table public.menu_items drop column if exists tenant_id;
alter table public.events drop column if exists tenant_id;
alter table public.quotes drop column if exists tenant_id;
alter table public.testimonials drop column if exists tenant_id;
alter table public.contacts drop column if exists tenant_id;
alter table public.interactions drop column if exists tenant_id;

-- 4. Restore the original contacts email unique index
drop index if exists contacts_email_idx;
create unique index contacts_email_idx on public.contacts (lower(email));

-- 5. Drop the helper function and the new tables
drop function if exists public.tenant_ids_for_current_user();
drop table if exists public.tenant_users;
drop table if exists public.tenants;

commit;
```

**After rollback**: the database is back to the schema state of
`20260408_crm_and_auth.sql`. The application should continue to work
unchanged. Investigate the root cause, fix the forward migration, and
re-apply.

---

## Troubleshooting

### "policy already exists" error

The migration was partially applied. Run:

```sql
drop policy if exists "<name>" on public.<table>;
```

for the conflicting policy, then re-run the migration.

### "null value in column tenant_id violates not-null constraint"

The backfill did not cover some rows (e.g., rows were inserted into a table
between steps 1 and 3 of the migration). Because the migration is
transactional, this should be impossible in practice. If you see it,
check for concurrent writes during the migration window.

### Tests fail with "permission denied for table tenant_users"

The helper function `tenant_ids_for_current_user()` MUST be
`security definer`. Check the function definition:

```sql
\df+ public.tenant_ids_for_current_user
```

If the `Security` column shows `invoker`, re-create the function with
`security definer set search_path = public`.

### `supabase start` fails

Check Docker is running. Clean up any stale containers:

```bash
supabase stop --no-backup
docker system prune -f
supabase start
```
