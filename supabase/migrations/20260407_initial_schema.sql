create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null,
  price_cents integer not null,
  size text not null,
  dietary text[] not null default '{}',
  occasion text[] not null default '{}',
  lead_time text not null,
  image_url text not null,
  featured boolean not null default false,
  order_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  title text not null,
  date timestamptz not null,
  location text not null,
  description text not null,
  image_url text not null,
  join_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  event_date date not null,
  event_type text not null,
  guests text not null,
  services text[] not null default '{}',
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id text primary key,
  name text not null,
  occasion text not null,
  quote text not null,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;
alter table public.events enable row level security;
alter table public.quotes enable row level security;
alter table public.testimonials enable row level security;

drop policy if exists "Public read menu_items" on public.menu_items;
create policy "Public read menu_items"
  on public.menu_items
  for select
  using (true);

drop policy if exists "Authenticated write menu_items" on public.menu_items;
create policy "Authenticated write menu_items"
  on public.menu_items
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public read events" on public.events;
create policy "Public read events"
  on public.events
  for select
  using (true);

drop policy if exists "Authenticated write events" on public.events;
create policy "Authenticated write events"
  on public.events
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public read testimonials" on public.testimonials;
create policy "Public read testimonials"
  on public.testimonials
  for select
  using (true);

drop policy if exists "Authenticated write testimonials" on public.testimonials;
create policy "Authenticated write testimonials"
  on public.testimonials
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public insert quotes" on public.quotes;
create policy "Public insert quotes"
  on public.quotes
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated read quotes" on public.quotes;
create policy "Authenticated read quotes"
  on public.quotes
  for select
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values
  ('boards', 'boards', true),
  ('events', 'events', true)
on conflict (id) do nothing;

drop policy if exists "Public read board images" on storage.objects;
create policy "Public read board images"
  on storage.objects
  for select
  using (bucket_id = 'boards');

drop policy if exists "Authenticated upload board images" on storage.objects;
create policy "Authenticated upload board images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'boards');

drop policy if exists "Authenticated update board images" on storage.objects;
create policy "Authenticated update board images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'boards')
  with check (bucket_id = 'boards');

drop policy if exists "Authenticated delete board images" on storage.objects;
create policy "Authenticated delete board images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'boards');

drop policy if exists "Public read event images" on storage.objects;
create policy "Public read event images"
  on storage.objects
  for select
  using (bucket_id = 'events');

drop policy if exists "Authenticated upload event images" on storage.objects;
create policy "Authenticated upload event images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'events');

drop policy if exists "Authenticated update event images" on storage.objects;
create policy "Authenticated update event images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'events')
  with check (bucket_id = 'events');

drop policy if exists "Authenticated delete event images" on storage.objects;
create policy "Authenticated delete event images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'events');

