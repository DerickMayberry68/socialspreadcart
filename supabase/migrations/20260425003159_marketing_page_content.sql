-- ============================================================
-- Feature 014: Editable Marketing Pages
-- ------------------------------------------------------------
-- Adds a tenant-scoped page content store for public marketing
-- page copy and image fields that do not already have dedicated
-- content tables.
--
-- Reads are public for page rendering; writes are limited to
-- tenant admins/owners through admin_tenant_ids_for_current_user().
-- ============================================================

begin;

create table if not exists public.marketing_page_content (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  page_key text not null
    check (page_key in ('shell', 'home', 'menu', 'events', 'cart-service', 'contact')),
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (tenant_id, page_key)
);

create index if not exists marketing_page_content_page_key_idx
  on public.marketing_page_content (page_key);

alter table public.marketing_page_content enable row level security;

drop policy if exists "marketing_page_content_public_select" on public.marketing_page_content;
create policy "marketing_page_content_public_select"
  on public.marketing_page_content for select
  to anon, authenticated
  using (true);

drop policy if exists "marketing_page_content_admin_insert" on public.marketing_page_content;
create policy "marketing_page_content_admin_insert"
  on public.marketing_page_content for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "marketing_page_content_admin_update" on public.marketing_page_content;
create policy "marketing_page_content_admin_update"
  on public.marketing_page_content for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

commit;
