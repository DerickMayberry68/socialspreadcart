-- ============================================================
-- Feature 012: Admin-Editable Hero and Pathway Cards
-- ------------------------------------------------------------
-- Adds three tenant-scoped content tables for the public home
-- page (site_configuration, hero_content, pathway_cards), plus
-- a seed trigger so every existing and future tenant starts with
-- a complete, professional default home page.
--
-- Writes are gated to tenant admins/owners via the existing
-- tenant_users role set; reads are public so unauthenticated
-- visitors can render the public home page.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Admin role helper (admin or owner only)
-- ------------------------------------------------------------
-- Complements tenant_ids_for_current_user() from migration
-- 20260410_multi_tenancy.sql. Used as the WITH CHECK /
-- USING expression for the admin-only write policies below.
create or replace function public.admin_tenant_ids_for_current_user()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_users
  where user_id = auth.uid()
    and role in ('owner', 'admin')
$$;

revoke all on function public.admin_tenant_ids_for_current_user() from public;
grant execute on function public.admin_tenant_ids_for_current_user() to anon, authenticated;

-- ------------------------------------------------------------
-- 2. site_configuration (singleton per tenant)
-- ------------------------------------------------------------
create table if not exists public.site_configuration (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  brand_name text not null
    check (char_length(brand_name) between 1 and 80),
  brand_tagline text not null default ''
    check (char_length(brand_tagline) <= 140),
  booking_cta_label text not null
    check (char_length(booking_cta_label) between 1 and 32),
  booking_cta_target text not null
    check (char_length(booking_cta_target) between 1 and 2048),
  support_phone text
    check (support_phone is null or char_length(support_phone) <= 32),
  support_email text
    check (support_email is null or char_length(support_email) <= 254),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ------------------------------------------------------------
-- 3. hero_content (singleton per tenant)
-- ------------------------------------------------------------
create table if not exists public.hero_content (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  headline text not null
    check (char_length(headline) between 1 and 120),
  sub_line text not null default ''
    check (char_length(sub_line) <= 80),
  body text not null
    check (char_length(body) between 1 and 400),
  primary_cta_label text not null default ''
    check (char_length(primary_cta_label) <= 32),
  primary_cta_target text not null default ''
    check (char_length(primary_cta_target) <= 2048),
  secondary_cta_label text not null default ''
    check (char_length(secondary_cta_label) <= 32),
  secondary_cta_target text not null default ''
    check (char_length(secondary_cta_target) <= 2048),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ------------------------------------------------------------
-- 4. pathway_cards (exactly 3 per tenant, display_order 1-3)
-- ------------------------------------------------------------
create table if not exists public.pathway_cards (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  display_order smallint not null
    check (display_order between 1 and 3),
  title text not null
    check (char_length(title) between 1 and 80),
  body text not null
    check (char_length(body) between 1 and 200),
  badge text not null default ''
    check (char_length(badge) <= 24),
  link_target text not null
    check (char_length(link_target) between 1 and 2048),
  image_url text not null
    check (char_length(image_url) between 1 and 2048),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (tenant_id, display_order)
);

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
-- site_configuration: public read (page renders for anon); admin-only writes
alter table public.site_configuration enable row level security;

drop policy if exists "site_configuration_public_select" on public.site_configuration;
create policy "site_configuration_public_select"
  on public.site_configuration for select
  to anon, authenticated
  using (true);

drop policy if exists "site_configuration_admin_insert" on public.site_configuration;
create policy "site_configuration_admin_insert"
  on public.site_configuration for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "site_configuration_admin_update" on public.site_configuration;
create policy "site_configuration_admin_update"
  on public.site_configuration for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

-- no delete policy: deletes cascade from tenants only

-- hero_content: same shape
alter table public.hero_content enable row level security;

drop policy if exists "hero_content_public_select" on public.hero_content;
create policy "hero_content_public_select"
  on public.hero_content for select
  to anon, authenticated
  using (true);

drop policy if exists "hero_content_admin_insert" on public.hero_content;
create policy "hero_content_admin_insert"
  on public.hero_content for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "hero_content_admin_update" on public.hero_content;
create policy "hero_content_admin_update"
  on public.hero_content for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

-- pathway_cards: same shape
alter table public.pathway_cards enable row level security;

drop policy if exists "pathway_cards_public_select" on public.pathway_cards;
create policy "pathway_cards_public_select"
  on public.pathway_cards for select
  to anon, authenticated
  using (true);

drop policy if exists "pathway_cards_admin_insert" on public.pathway_cards;
create policy "pathway_cards_admin_insert"
  on public.pathway_cards for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "pathway_cards_admin_update" on public.pathway_cards;
create policy "pathway_cards_admin_update"
  on public.pathway_cards for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

-- ------------------------------------------------------------
-- 6. Seed trigger for new tenants + one-time backfill
-- ------------------------------------------------------------
create or replace function public.seed_site_content_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_configuration
    (tenant_id, brand_name, brand_tagline, booking_cta_label,
     booking_cta_target, support_phone, support_email)
  values
    (NEW.id,
     coalesce(NEW.name, 'Your Brand'),
     '',
     'Book the Cart',
     '/contact',
     null,
     null)
  on conflict (tenant_id) do nothing;

  insert into public.hero_content
    (tenant_id, headline, sub_line, body,
     primary_cta_label, primary_cta_target,
     secondary_cta_label, secondary_cta_target)
  values
    (NEW.id,
     'An elevated approach to hosting, designed to be experienced.',
     'Snacks & sips, served your way.',
     'The Social Spread is a luxury mobile cart bringing curated bites and signature sips directly to your event so you can host effortlessly and leave a lasting impression.',
     'Start Your Order',
     '/contact',
     'Browse the Menu',
     '/menu')
  on conflict (tenant_id) do nothing;

  insert into public.pathway_cards
    (tenant_id, display_order, title, body, badge, link_target, image_url)
  values
    (NEW.id, 1,
     'Pickup for gifting and easy hosting',
     'Order polished boxes, charcuterie cups, and bundles when you want something special without full-service catering.',
     'Fastest path',
     '/menu',
     '/food/charcuterie-spread.jpg'),
    (NEW.id, 2,
     'Cart service that becomes part of the decor',
     'A styled setup for showers, weddings, community activations, school events, and private gatherings that deserve a focal point.',
     'Event favorite',
     '/contact',
     '/client/cart-umbrella-wide.jpg'),
    (NEW.id, 3,
     'Pop-ups worth planning around',
     'Keep an eye on public events for signature sips, grab-and-go bites, and seasonal specials around Northwest Arkansas.',
     'Community favorite',
     '/events',
     '/client/cart-dirty-soda-hero.jpg')
  on conflict (tenant_id, display_order) do nothing;

  return NEW;
end;
$$;

drop trigger if exists trg_tenants_seed_site_content on public.tenants;
create trigger trg_tenants_seed_site_content
  after insert on public.tenants
  for each row execute function public.seed_site_content_for_tenant();

-- One-time backfill: seed defaults for every existing tenant.
-- Uses the same ON CONFLICT DO NOTHING guards so re-running is safe.
insert into public.site_configuration
  (tenant_id, brand_name, brand_tagline, booking_cta_label,
   booking_cta_target, support_phone, support_email)
select
  t.id,
  coalesce(t.name, 'Your Brand'),
  '',
  'Book the Cart',
  '/contact',
  null,
  null
from public.tenants t
on conflict (tenant_id) do nothing;

insert into public.hero_content
  (tenant_id, headline, sub_line, body,
   primary_cta_label, primary_cta_target,
   secondary_cta_label, secondary_cta_target)
select
  t.id,
  'An elevated approach to hosting, designed to be experienced.',
  'Snacks & sips, served your way.',
  'The Social Spread is a luxury mobile cart bringing curated bites and signature sips directly to your event so you can host effortlessly and leave a lasting impression.',
  'Start Your Order',
  '/contact',
  'Browse the Menu',
  '/menu'
from public.tenants t
on conflict (tenant_id) do nothing;

insert into public.pathway_cards
  (tenant_id, display_order, title, body, badge, link_target, image_url)
select t.id, v.display_order, v.title, v.body, v.badge, v.link_target, v.image_url
from public.tenants t
cross join (values
  (1::smallint,
   'Pickup for gifting and easy hosting',
   'Order polished boxes, charcuterie cups, and bundles when you want something special without full-service catering.',
   'Fastest path',
   '/menu',
   '/food/charcuterie-spread.jpg'),
  (2::smallint,
   'Cart service that becomes part of the decor',
   'A styled setup for showers, weddings, community activations, school events, and private gatherings that deserve a focal point.',
   'Event favorite',
   '/contact',
   '/client/cart-umbrella-wide.jpg'),
  (3::smallint,
   'Pop-ups worth planning around',
   'Keep an eye on public events for signature sips, grab-and-go bites, and seasonal specials around Northwest Arkansas.',
   'Community favorite',
   '/events',
   '/client/cart-dirty-soda-hero.jpg')
) as v(display_order, title, body, badge, link_target, image_url)
on conflict (tenant_id, display_order) do nothing;

commit;
