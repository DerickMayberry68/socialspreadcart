-- ============================================================
-- Phase 1: CRM + Auth schema
-- Adds: profiles, contacts, interactions
-- Alters: quotes (contact_id, status)
-- ============================================================

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Contacts (one record per customer, upserted by email)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  source text not null default 'contact_form' check (source in ('quote', 'contact_form')),
  status text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_email_idx on public.contacts (lower(email));

-- Interactions (activity timeline per contact)
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  type text not null check (type in ('quote_submitted', 'note', 'follow_up', 'status_change', 'contact_form')),
  body text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Alter quotes: add contact_id and status
alter table public.quotes
  add column if not exists contact_id uuid references public.contacts (id) on delete set null,
  add column if not exists status text not null default 'new'
    check (status in ('new', 'in_progress', 'booked', 'closed', 'lost')),
  add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;

-- Profiles: authenticated users can read all; only own row can be updated
drop policy if exists "Authenticated read profiles" on public.profiles;
create policy "Authenticated read profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Own profile update" on public.profiles;
create policy "Own profile update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Contacts: authenticated full access
drop policy if exists "Authenticated all contacts" on public.contacts;
create policy "Authenticated all contacts"
  on public.contacts for all
  to authenticated
  using (true)
  with check (true);

-- Interactions: authenticated full access
drop policy if exists "Authenticated all interactions" on public.interactions;
create policy "Authenticated all interactions"
  on public.interactions for all
  to authenticated
  using (true)
  with check (true);

-- Quotes: add update + delete for authenticated (insert already exists)
drop policy if exists "Authenticated update quotes" on public.quotes;
create policy "Authenticated update quotes"
  on public.quotes for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated delete quotes" on public.quotes;
create policy "Authenticated delete quotes"
  on public.quotes for delete
  to authenticated
  using (true);
