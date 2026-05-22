create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  display_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  occasion text,
  customer_email text,
  customer_phone text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'hidden')),
  source text not null default 'floating_cta',
  admin_note text,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  hidden_at timestamptz,
  hidden_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_reviews_tenant_status_idx
  on public.customer_reviews (tenant_id, status, approved_at desc, submitted_at desc);

create index if not exists customer_reviews_recent_duplicate_idx
  on public.customer_reviews (tenant_id, lower(display_name), submitted_at desc);

create or replace function public.set_customer_reviews_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_reviews_set_updated_at on public.customer_reviews;
create trigger customer_reviews_set_updated_at
  before update on public.customer_reviews
  for each row
  execute function public.set_customer_reviews_updated_at();

alter table public.customer_reviews enable row level security;

drop policy if exists "customer_reviews_admin_select" on public.customer_reviews;
create policy "customer_reviews_admin_select"
  on public.customer_reviews
  for select
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "customer_reviews_admin_insert" on public.customer_reviews;
create policy "customer_reviews_admin_insert"
  on public.customer_reviews
  for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "customer_reviews_admin_update" on public.customer_reviews;
create policy "customer_reviews_admin_update"
  on public.customer_reviews
  for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "customer_reviews_admin_delete" on public.customer_reviews;
create policy "customer_reviews_admin_delete"
  on public.customer_reviews
  for delete
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()));

comment on table public.customer_reviews is
  'Tenant-scoped customer-submitted reviews. Public site access must use application service projections, not raw public table reads.';
