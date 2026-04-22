-- ============================================================
-- Feature 001: Admin Gallery Content
-- ------------------------------------------------------------
-- Adds tenant-scoped editable gallery section copy and ordered
-- gallery images for the public gallery page.
--
-- Reads are public for active gallery content; writes are limited
-- to tenant admins/owners through admin_tenant_ids_for_current_user().
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. gallery_section_content (singleton per tenant)
-- ------------------------------------------------------------
create table if not exists public.gallery_section_content (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  eyebrow text not null default 'Gallery'
    check (char_length(eyebrow) <= 40),
  title text not null
    check (char_length(title) between 1 and 180),
  description text not null
    check (char_length(description) between 1 and 500),
  feature_card_eyebrow text not null default ''
    check (char_length(feature_card_eyebrow) <= 60),
  feature_card_title text not null
    check (char_length(feature_card_title) between 1 and 220),
  support_card_body text not null
    check (char_length(support_card_body) between 1 and 320),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ------------------------------------------------------------
-- 2. gallery_images (ordered collection per tenant)
-- ------------------------------------------------------------
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  display_order integer not null check (display_order > 0),
  title text not null
    check (char_length(title) between 1 and 140),
  eyebrow text not null default ''
    check (char_length(eyebrow) <= 60),
  alt_text text not null
    check (char_length(alt_text) between 1 and 180),
  image_url text not null
    check (char_length(image_url) between 1 and 2048),
  storage_path text
    check (storage_path is null or char_length(storage_path) <= 2048),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (tenant_id, display_order)
);

create index if not exists gallery_images_tenant_order_idx
  on public.gallery_images (tenant_id, display_order);

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
alter table public.gallery_section_content enable row level security;

drop policy if exists "gallery_section_content_public_select" on public.gallery_section_content;
create policy "gallery_section_content_public_select"
  on public.gallery_section_content for select
  to anon, authenticated
  using (true);

drop policy if exists "gallery_section_content_admin_insert" on public.gallery_section_content;
create policy "gallery_section_content_admin_insert"
  on public.gallery_section_content for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "gallery_section_content_admin_update" on public.gallery_section_content;
create policy "gallery_section_content_admin_update"
  on public.gallery_section_content for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

alter table public.gallery_images enable row level security;

drop policy if exists "gallery_images_public_select" on public.gallery_images;
create policy "gallery_images_public_select"
  on public.gallery_images for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "gallery_images_admin_insert" on public.gallery_images;
create policy "gallery_images_admin_insert"
  on public.gallery_images for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "gallery_images_admin_update" on public.gallery_images;
create policy "gallery_images_admin_update"
  on public.gallery_images for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "gallery_images_admin_delete" on public.gallery_images;
create policy "gallery_images_admin_delete"
  on public.gallery_images for delete
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()));

-- ------------------------------------------------------------
-- 4. Seed trigger for new tenants + one-time backfill
-- ------------------------------------------------------------
create or replace function public.seed_gallery_content_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gallery_section_content
    (tenant_id, eyebrow, title, description, feature_card_eyebrow,
     feature_card_title, support_card_body)
  values
    (NEW.id,
     'Gallery',
     'A visual library of real cart service, drinks, grazing, and event-ready moments.',
     'This page leans on actual client photography so the brand feels grounded in the real offering, not just the aesthetic direction.',
     'What the gallery should do',
     'Make the product feel real, the events feel joyful, and the brand feel worth trusting.',
     'The goal is not just to show pretty images. It is to help future clients picture what the menu and the cart will feel like in their own event.')
  on conflict (tenant_id) do nothing;

  insert into public.gallery_images
    (tenant_id, display_order, title, eyebrow, alt_text, image_url)
  values
    (NEW.id, 1,
     'Dirty soda service from the cart',
     'Cart Service',
     'Dirty soda service from the cart',
     '/client/cart-dirty-soda-hero.jpg'),
    (NEW.id, 2,
     'A mini pancake bar styled for brunches, showers, and event-day service',
     'Mini Pancake Bar',
     'A mini pancake bar styled for brunches, showers, and event-day service',
     '/client/mini-pancake-bar.jpg'),
    (NEW.id, 3,
     'Grab-and-go charcuterie cups for pop-ups and parties',
     'Charcuterie Cups',
     'Grab-and-go charcuterie cups for pop-ups and parties',
     '/client/charcuterie-cup-closeup.jpg'),
    (NEW.id, 4,
     'The cart setup ready for a real event day',
     'Event Setup',
     'The cart setup ready for a real event day',
     '/client/cart-umbrella-wide.jpg'),
    (NEW.id, 5,
     'Snack box styling paired with a bright drink',
     'Snack + Sip',
     'Snack box styling paired with a bright drink',
     '/client/dirty-soda-and-charcuterie-box.jpg'),
    (NEW.id, 6,
     'A close-up charcuterie moment for grazing service',
     'Charcuterie',
     'A close-up charcuterie moment for grazing service',
     '/client/charcuterie-cup-detail.jpg')
  on conflict (tenant_id, display_order) do nothing;

  return NEW;
end;
$$;

drop trigger if exists trg_tenants_seed_gallery_content on public.tenants;
create trigger trg_tenants_seed_gallery_content
  after insert on public.tenants
  for each row execute function public.seed_gallery_content_for_tenant();

insert into public.gallery_section_content
  (tenant_id, eyebrow, title, description, feature_card_eyebrow,
   feature_card_title, support_card_body)
select
  t.id,
  'Gallery',
  'A visual library of real cart service, drinks, grazing, and event-ready moments.',
  'This page leans on actual client photography so the brand feels grounded in the real offering, not just the aesthetic direction.',
  'What the gallery should do',
  'Make the product feel real, the events feel joyful, and the brand feel worth trusting.',
  'The goal is not just to show pretty images. It is to help future clients picture what the menu and the cart will feel like in their own event.'
from public.tenants t
on conflict (tenant_id) do nothing;

insert into public.gallery_images
  (tenant_id, display_order, title, eyebrow, alt_text, image_url)
select t.id, v.display_order, v.title, v.eyebrow, v.alt_text, v.image_url
from public.tenants t
cross join (values
  (1,
   'Dirty soda service from the cart',
   'Cart Service',
   'Dirty soda service from the cart',
   '/client/cart-dirty-soda-hero.jpg'),
  (2,
   'A mini pancake bar styled for brunches, showers, and event-day service',
   'Mini Pancake Bar',
   'A mini pancake bar styled for brunches, showers, and event-day service',
   '/client/mini-pancake-bar.jpg'),
  (3,
   'Grab-and-go charcuterie cups for pop-ups and parties',
   'Charcuterie Cups',
   'Grab-and-go charcuterie cups for pop-ups and parties',
   '/client/charcuterie-cup-closeup.jpg'),
  (4,
   'The cart setup ready for a real event day',
   'Event Setup',
   'The cart setup ready for a real event day',
   '/client/cart-umbrella-wide.jpg'),
  (5,
   'Snack box styling paired with a bright drink',
   'Snack + Sip',
   'Snack box styling paired with a bright drink',
   '/client/dirty-soda-and-charcuterie-box.jpg'),
  (6,
   'A close-up charcuterie moment for grazing service',
   'Charcuterie',
   'A close-up charcuterie moment for grazing service',
   '/client/charcuterie-cup-detail.jpg')
) as v(display_order, title, eyebrow, alt_text, image_url)
on conflict (tenant_id, display_order) do nothing;

commit;
