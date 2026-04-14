-- ============================================================
-- Feature 002: Multi-Tenancy Schema & Row-Level Security
-- ------------------------------------------------------------
-- Adds:
--   * public.tenants
--   * public.tenant_users (membership + role)
--   * public.tenant_ids_for_current_user() RLS helper
-- Alters:
--   * menu_items, events, quotes, testimonials, contacts, interactions
--     each get a non-null tenant_id FK
--   * contacts unique index rescoped per-tenant
-- Replaces:
--   * All existing "using (true)" RLS policies on business tables
--     with tenant-scoped policies per spec 002/contracts/rls-policies.md
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. tenants table
-- ------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$')
);

-- ------------------------------------------------------------
-- 2. tenant_users membership table
-- ------------------------------------------------------------
create table if not exists public.tenant_users (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'staff'
    check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_users_user_idx
  on public.tenant_users (user_id);

-- ------------------------------------------------------------
-- 3. Seed the legacy tenant
-- ------------------------------------------------------------
insert into public.tenants (slug, name, status)
values ('sarah', 'The Social Spread Cart', 'active')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 4. Add tenant_id column to each business table (nullable),
--    backfill to the legacy tenant, then enforce not-null + FK.
-- ------------------------------------------------------------
do $$
declare
  legacy_id uuid;
begin
  select id into legacy_id from public.tenants where slug = 'sarah';

  if legacy_id is null then
    raise exception 'Legacy tenant (slug=sarah) was not created';
  end if;

  -- menu_items
  alter table public.menu_items add column if not exists tenant_id uuid;
  update public.menu_items set tenant_id = legacy_id where tenant_id is null;
  alter table public.menu_items alter column tenant_id set not null;

  -- events
  alter table public.events add column if not exists tenant_id uuid;
  update public.events set tenant_id = legacy_id where tenant_id is null;
  alter table public.events alter column tenant_id set not null;

  -- quotes
  alter table public.quotes add column if not exists tenant_id uuid;
  update public.quotes set tenant_id = legacy_id where tenant_id is null;
  alter table public.quotes alter column tenant_id set not null;

  -- testimonials
  alter table public.testimonials add column if not exists tenant_id uuid;
  update public.testimonials set tenant_id = legacy_id where tenant_id is null;
  alter table public.testimonials alter column tenant_id set not null;

  -- contacts
  alter table public.contacts add column if not exists tenant_id uuid;
  update public.contacts set tenant_id = legacy_id where tenant_id is null;
  alter table public.contacts alter column tenant_id set not null;

  -- interactions
  alter table public.interactions add column if not exists tenant_id uuid;
  update public.interactions set tenant_id = legacy_id where tenant_id is null;
  alter table public.interactions alter column tenant_id set not null;
end;
$$;

-- ------------------------------------------------------------
-- 5. FKs + supporting indexes
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'menu_items_tenant_id_fkey'
      and table_name = 'menu_items'
      and table_schema = 'public'
  ) then
    alter table public.menu_items
      add constraint menu_items_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'events_tenant_id_fkey'
      and table_name = 'events'
      and table_schema = 'public'
  ) then
    alter table public.events
      add constraint events_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'quotes_tenant_id_fkey'
      and table_name = 'quotes'
      and table_schema = 'public'
  ) then
    alter table public.quotes
      add constraint quotes_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'testimonials_tenant_id_fkey'
      and table_name = 'testimonials'
      and table_schema = 'public'
  ) then
    alter table public.testimonials
      add constraint testimonials_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'contacts_tenant_id_fkey'
      and table_name = 'contacts'
      and table_schema = 'public'
  ) then
    alter table public.contacts
      add constraint contacts_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'interactions_tenant_id_fkey'
      and table_name = 'interactions'
      and table_schema = 'public'
  ) then
    alter table public.interactions
      add constraint interactions_tenant_id_fkey
      foreign key (tenant_id) references public.tenants (id) on delete cascade;
  end if;
end;
$$;

create index if not exists menu_items_tenant_idx    on public.menu_items    (tenant_id);
create index if not exists events_tenant_idx        on public.events        (tenant_id);
create index if not exists quotes_tenant_idx        on public.quotes        (tenant_id);
create index if not exists testimonials_tenant_idx  on public.testimonials  (tenant_id);
create index if not exists contacts_tenant_idx      on public.contacts      (tenant_id);
create index if not exists interactions_tenant_idx  on public.interactions  (tenant_id);

-- ------------------------------------------------------------
-- 6. Rescope contacts email uniqueness to per-tenant
-- ------------------------------------------------------------
drop index if exists public.contacts_email_idx;
create unique index contacts_email_idx
  on public.contacts (tenant_id, lower(email));

-- ------------------------------------------------------------
-- 7. RLS helper function: tenants the current user belongs to
-- ------------------------------------------------------------
create or replace function public.tenant_ids_for_current_user()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_users
  where user_id = auth.uid()
$$;

revoke all on function public.tenant_ids_for_current_user() from public;
grant execute on function public.tenant_ids_for_current_user() to anon, authenticated;

-- ------------------------------------------------------------
-- 9. Enable RLS on the new tables
-- ------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;

-- tenants: authenticated users can read tenants they belong to
drop policy if exists "tenants_member_select" on public.tenants;
create policy "tenants_member_select"
  on public.tenants
  for select
  to authenticated
  using (id in (select public.tenant_ids_for_current_user()));

-- tenants: anon can read active tenants by slug (needed for subdomain lookup in Spec 003)
drop policy if exists "tenants_anon_select_active" on public.tenants;
create policy "tenants_anon_select_active"
  on public.tenants
  for select
  to anon
  using (status = 'active');

-- tenant_users: authenticated users can read their own memberships
drop policy if exists "tenant_users_self_select" on public.tenant_users;
create policy "tenant_users_self_select"
  on public.tenant_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- tenant_users: writes are service-role-only for now (Spec 006 will open this up
-- to owners via a separate helper and policy)
-- No insert/update/delete policies created -> authenticated writes are denied,
-- which is the desired behaviour until invitations ship.

-- ------------------------------------------------------------
-- 10. Drop legacy policies on the six business tables
-- ------------------------------------------------------------
-- menu_items
drop policy if exists "Public read menu_items" on public.menu_items;
drop policy if exists "Authenticated write menu_items" on public.menu_items;

-- events
drop policy if exists "Public read events" on public.events;
drop policy if exists "Authenticated write events" on public.events;

-- testimonials
drop policy if exists "Public read testimonials" on public.testimonials;
drop policy if exists "Authenticated write testimonials" on public.testimonials;

-- quotes
drop policy if exists "Public insert quotes" on public.quotes;
drop policy if exists "Authenticated read quotes" on public.quotes;
drop policy if exists "Authenticated update quotes" on public.quotes;
drop policy if exists "Authenticated delete quotes" on public.quotes;

-- contacts
drop policy if exists "Authenticated all contacts" on public.contacts;

-- interactions
drop policy if exists "Authenticated all interactions" on public.interactions;

-- ------------------------------------------------------------
-- 11. Pattern 2: Public Read / Tenant Write
--     menu_items, events, testimonials
-- ------------------------------------------------------------
-- menu_items
alter table public.menu_items enable row level security;

drop policy if exists "menu_items_public_select" on public.menu_items;
create policy "menu_items_public_select"
  on public.menu_items for select
  to anon, authenticated
  using (true);

drop policy if exists "menu_items_tenant_insert" on public.menu_items;
create policy "menu_items_tenant_insert"
  on public.menu_items for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "menu_items_tenant_update" on public.menu_items;
create policy "menu_items_tenant_update"
  on public.menu_items for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "menu_items_tenant_delete" on public.menu_items;
create policy "menu_items_tenant_delete"
  on public.menu_items for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

-- events
alter table public.events enable row level security;

drop policy if exists "events_public_select" on public.events;
create policy "events_public_select"
  on public.events for select
  to anon, authenticated
  using (true);

drop policy if exists "events_tenant_insert" on public.events;
create policy "events_tenant_insert"
  on public.events for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "events_tenant_update" on public.events;
create policy "events_tenant_update"
  on public.events for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "events_tenant_delete" on public.events;
create policy "events_tenant_delete"
  on public.events for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

-- testimonials
alter table public.testimonials enable row level security;

drop policy if exists "testimonials_public_select" on public.testimonials;
create policy "testimonials_public_select"
  on public.testimonials for select
  to anon, authenticated
  using (true);

drop policy if exists "testimonials_tenant_insert" on public.testimonials;
create policy "testimonials_tenant_insert"
  on public.testimonials for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "testimonials_tenant_update" on public.testimonials;
create policy "testimonials_tenant_update"
  on public.testimonials for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "testimonials_tenant_delete" on public.testimonials;
create policy "testimonials_tenant_delete"
  on public.testimonials for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

-- ------------------------------------------------------------
-- 12. Pattern 3: Public Insert / Tenant Read
--     quotes
-- ------------------------------------------------------------
alter table public.quotes enable row level security;

drop policy if exists "quotes_public_insert" on public.quotes;
create policy "quotes_public_insert"
  on public.quotes for insert
  to anon, authenticated
  with check (
    tenant_id is not null
    and exists (
      select 1 from public.tenants t
      where t.id = tenant_id and t.status = 'active'
    )
  );

drop policy if exists "quotes_tenant_select" on public.quotes;
create policy "quotes_tenant_select"
  on public.quotes for select
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "quotes_tenant_update" on public.quotes;
create policy "quotes_tenant_update"
  on public.quotes for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "quotes_tenant_delete" on public.quotes;
create policy "quotes_tenant_delete"
  on public.quotes for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

-- ------------------------------------------------------------
-- 13. Pattern 1: Tenant-Only
--     contacts, interactions
-- ------------------------------------------------------------
-- contacts
alter table public.contacts enable row level security;

drop policy if exists "contacts_tenant_select" on public.contacts;
create policy "contacts_tenant_select"
  on public.contacts for select
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "contacts_tenant_insert" on public.contacts;
create policy "contacts_tenant_insert"
  on public.contacts for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "contacts_tenant_update" on public.contacts;
create policy "contacts_tenant_update"
  on public.contacts for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "contacts_tenant_delete" on public.contacts;
create policy "contacts_tenant_delete"
  on public.contacts for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

-- interactions
alter table public.interactions enable row level security;

drop policy if exists "interactions_tenant_select" on public.interactions;
create policy "interactions_tenant_select"
  on public.interactions for select
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "interactions_tenant_insert" on public.interactions;
create policy "interactions_tenant_insert"
  on public.interactions for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "interactions_tenant_update" on public.interactions;
create policy "interactions_tenant_update"
  on public.interactions for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "interactions_tenant_delete" on public.interactions;
create policy "interactions_tenant_delete"
  on public.interactions for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

-- ------------------------------------------------------------
-- 14. Backfill: link existing admin profiles as owners of the legacy tenant
-- ------------------------------------------------------------
insert into public.tenant_users (tenant_id, user_id, role)
select
  (select id from public.tenants where slug = 'sarah'),
  p.id,
  'owner'
from public.profiles p
where p.role = 'admin'
on conflict (tenant_id, user_id) do nothing;

commit;
