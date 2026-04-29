-- ============================================================
-- Feature 013: Admin About Content
-- ------------------------------------------------------------
-- Adds tenant-scoped editable About page copy, ordered images,
-- and three feature cards for the public About page.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. about_page_content (singleton per tenant)
-- ------------------------------------------------------------
create table if not exists public.about_page_content (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  eyebrow text not null default 'About The Brand'
    check (char_length(eyebrow) <= 40),
  title text not null
    check (char_length(title) between 1 and 220),
  description text not null
    check (char_length(description) between 1 and 600),
  story_badge text not null default ''
    check (char_length(story_badge) <= 60),
  story_title text not null
    check (char_length(story_title) between 1 and 240),
  story_body jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(story_body) = 'array'
      and jsonb_array_length(story_body) between 1 and 4
    ),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ------------------------------------------------------------
-- 2. about_images (ordered collection per tenant)
-- ------------------------------------------------------------
create table if not exists public.about_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  display_order integer not null check (display_order > 0),
  image_url text not null
    check (char_length(image_url) between 1 and 2048),
  storage_path text
    check (storage_path is null or char_length(storage_path) <= 2048),
  alt_text text not null
    check (char_length(alt_text) between 1 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (tenant_id, display_order)
);

create index if not exists about_images_tenant_order_idx
  on public.about_images (tenant_id, display_order);

-- ------------------------------------------------------------
-- 3. about_feature_cards (exactly three rows per tenant)
-- ------------------------------------------------------------
create table if not exists public.about_feature_cards (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  display_order integer not null check (display_order in (1, 2, 3)),
  title text not null
    check (char_length(title) between 1 and 80),
  body text not null
    check (char_length(body) between 1 and 220),
  icon_key text not null
    check (char_length(icon_key) between 1 and 40),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (tenant_id, display_order)
);

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
alter table public.about_page_content enable row level security;

drop policy if exists "about_page_content_public_select" on public.about_page_content;
create policy "about_page_content_public_select"
  on public.about_page_content for select
  to anon, authenticated
  using (true);

drop policy if exists "about_page_content_admin_insert" on public.about_page_content;
create policy "about_page_content_admin_insert"
  on public.about_page_content for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "about_page_content_admin_update" on public.about_page_content;
create policy "about_page_content_admin_update"
  on public.about_page_content for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

alter table public.about_images enable row level security;

drop policy if exists "about_images_public_select" on public.about_images;
create policy "about_images_public_select"
  on public.about_images for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "about_images_admin_insert" on public.about_images;
create policy "about_images_admin_insert"
  on public.about_images for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "about_images_admin_update" on public.about_images;
create policy "about_images_admin_update"
  on public.about_images for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "about_images_admin_delete" on public.about_images;
create policy "about_images_admin_delete"
  on public.about_images for delete
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()));

alter table public.about_feature_cards enable row level security;

drop policy if exists "about_feature_cards_public_select" on public.about_feature_cards;
create policy "about_feature_cards_public_select"
  on public.about_feature_cards for select
  to anon, authenticated
  using (true);

drop policy if exists "about_feature_cards_admin_insert" on public.about_feature_cards;
create policy "about_feature_cards_admin_insert"
  on public.about_feature_cards for insert
  to authenticated
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

drop policy if exists "about_feature_cards_admin_update" on public.about_feature_cards;
create policy "about_feature_cards_admin_update"
  on public.about_feature_cards for update
  to authenticated
  using (tenant_id in (select public.admin_tenant_ids_for_current_user()))
  with check (tenant_id in (select public.admin_tenant_ids_for_current_user()));

-- ------------------------------------------------------------
-- 5. Seed trigger for new tenants + one-time backfill
-- ------------------------------------------------------------
create or replace function public.seed_about_content_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.about_page_content
    (tenant_id, eyebrow, title, description, story_badge, story_title, story_body)
  values
    (NEW.id,
     'About The Brand',
     'A hospitality brand built to feel polished, cheerful, and easy to welcome into the room.',
     'The Social Spread Cart exists for hosts who want the event to feel thoughtful and memorable without adding more stress to the planning process.',
     'Bentonville based',
     'Thoughtful presentation, warm hospitality, and a little bit of delight in every setup.',
     '[
       "The Social Spread Cart was created for hosts who want something more memorable than standard catering. Every menu and cart setup is designed to feel intentional, approachable, and easy to enjoy.",
       "From take-home orders to full event setups, the current offer centers on large charcuterie boxes, charcuterie cups, dirty soda, and a small set of cart services including a mini pancake bar, bartending, and event-ready station setups.",
       "We serve Bentonville and nearby Northwest Arkansas communities with pickup items, local delivery, and on-site cart experiences."
     ]'::jsonb)
  on conflict (tenant_id) do nothing;

  insert into public.about_images
    (tenant_id, display_order, image_url, alt_text)
  values
    (NEW.id, 1, '/client/cart-umbrella-wide.jpg', 'The Social Spread Cart setup ready for an event day'),
    (NEW.id, 2, '/client/cart-dirty-soda-hero.jpg', 'Dirty soda service from The Social Spread Cart'),
    (NEW.id, 3, '/client/mini-pancake-bar.jpg', 'Mini pancake bar styled for a brunch or shower'),
    (NEW.id, 4, '/client/dirty-soda-and-charcuterie-box.jpg', 'Dirty soda and charcuterie box styling')
  on conflict (tenant_id, display_order) do nothing;

  insert into public.about_feature_cards
    (tenant_id, display_order, title, body, icon_key)
  values
    (NEW.id, 1, 'Approachable service', 'The experience should feel easy for the host and welcoming for every guest.', 'heart-handshake'),
    (NEW.id, 2, 'Playful polish', 'The brand mixes premium presentation with bright, celebratory energy.', 'sparkles'),
    (NEW.id, 3, 'Locally rooted', 'Built for Bentonville and the wider Northwest Arkansas event scene.', 'map-pin')
  on conflict (tenant_id, display_order) do nothing;

  return NEW;
end;
$$;

drop trigger if exists trg_tenants_seed_about_content on public.tenants;
create trigger trg_tenants_seed_about_content
  after insert on public.tenants
  for each row execute function public.seed_about_content_for_tenant();

insert into public.about_page_content
  (tenant_id, eyebrow, title, description, story_badge, story_title, story_body)
select
  t.id,
  'About The Brand',
  'A hospitality brand built to feel polished, cheerful, and easy to welcome into the room.',
  'The Social Spread Cart exists for hosts who want the event to feel thoughtful and memorable without adding more stress to the planning process.',
  'Bentonville based',
  'Thoughtful presentation, warm hospitality, and a little bit of delight in every setup.',
  '[
    "The Social Spread Cart was created for hosts who want something more memorable than standard catering. Every menu and cart setup is designed to feel intentional, approachable, and easy to enjoy.",
    "From take-home orders to full event setups, the current offer centers on large charcuterie boxes, charcuterie cups, dirty soda, and a small set of cart services including a mini pancake bar, bartending, and event-ready station setups.",
    "We serve Bentonville and nearby Northwest Arkansas communities with pickup items, local delivery, and on-site cart experiences."
  ]'::jsonb
from public.tenants t
on conflict (tenant_id) do nothing;

insert into public.about_images
  (tenant_id, display_order, image_url, alt_text)
select t.id, v.display_order, v.image_url, v.alt_text
from public.tenants t
cross join (values
  (1, '/client/cart-umbrella-wide.jpg', 'The Social Spread Cart setup ready for an event day'),
  (2, '/client/cart-dirty-soda-hero.jpg', 'Dirty soda service from The Social Spread Cart'),
  (3, '/client/mini-pancake-bar.jpg', 'Mini pancake bar styled for a brunch or shower'),
  (4, '/client/dirty-soda-and-charcuterie-box.jpg', 'Dirty soda and charcuterie box styling')
) as v(display_order, image_url, alt_text)
on conflict (tenant_id, display_order) do nothing;

insert into public.about_feature_cards
  (tenant_id, display_order, title, body, icon_key)
select t.id, v.display_order, v.title, v.body, v.icon_key
from public.tenants t
cross join (values
  (1, 'Approachable service', 'The experience should feel easy for the host and welcoming for every guest.', 'heart-handshake'),
  (2, 'Playful polish', 'The brand mixes premium presentation with bright, celebratory energy.', 'sparkles'),
  (3, 'Locally rooted', 'Built for Bentonville and the wider Northwest Arkansas event scene.', 'map-pin')
) as v(display_order, title, body, icon_key)
on conflict (tenant_id, display_order) do nothing;

commit;
