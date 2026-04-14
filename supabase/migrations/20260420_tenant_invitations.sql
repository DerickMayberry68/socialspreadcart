begin;

create or replace function public.owner_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_users
  where user_id = auth.uid()
    and role = 'owner'
$$;

revoke all on function public.owner_tenant_ids() from public;
grant execute on function public.owner_tenant_ids() to authenticated;

create table if not exists public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'staff')),
  token text not null unique,
  invited_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists tenant_invitations_tenant_idx
  on public.tenant_invitations (tenant_id);

create index if not exists tenant_invitations_email_idx
  on public.tenant_invitations (lower(email));

alter table public.tenant_invitations enable row level security;

drop policy if exists "tenant_users_self_select" on public.tenant_users;
create policy "tenant_users_self_select"
  on public.tenant_users
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "tenant_users_owner_select" on public.tenant_users;
create policy "tenant_users_owner_select"
  on public.tenant_users
  for select
  to authenticated
  using (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_users_owner_insert" on public.tenant_users;
create policy "tenant_users_owner_insert"
  on public.tenant_users
  for insert
  to authenticated
  with check (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_users_owner_update" on public.tenant_users;
create policy "tenant_users_owner_update"
  on public.tenant_users
  for update
  to authenticated
  using (tenant_id in (select public.owner_tenant_ids()))
  with check (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_users_owner_delete" on public.tenant_users;
create policy "tenant_users_owner_delete"
  on public.tenant_users
  for delete
  to authenticated
  using (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_invitations_owner_select" on public.tenant_invitations;
create policy "tenant_invitations_owner_select"
  on public.tenant_invitations
  for select
  to authenticated
  using (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_invitations_owner_insert" on public.tenant_invitations;
create policy "tenant_invitations_owner_insert"
  on public.tenant_invitations
  for insert
  to authenticated
  with check (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_invitations_owner_update" on public.tenant_invitations;
create policy "tenant_invitations_owner_update"
  on public.tenant_invitations
  for update
  to authenticated
  using (tenant_id in (select public.owner_tenant_ids()))
  with check (tenant_id in (select public.owner_tenant_ids()));

drop policy if exists "tenant_invitations_owner_delete" on public.tenant_invitations;
create policy "tenant_invitations_owner_delete"
  on public.tenant_invitations
  for delete
  to authenticated
  using (tenant_id in (select public.owner_tenant_ids()));

commit;
