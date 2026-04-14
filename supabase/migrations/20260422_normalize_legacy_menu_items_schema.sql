begin;

-- Bring older menu_items tables up to the current application shape.
-- Safe for databases that still have legacy columns like:
--   id bigint, price, category
-- and are missing:
--   slug, price_cents, size, occasion, lead_time, order_url, featured, is_active

alter table public.menu_items
  alter column id drop identity if exists;

alter table public.menu_items
  alter column id drop default;

alter table public.menu_items
  alter column id type text using id::text;

alter table public.menu_items
  add column if not exists slug text,
  add column if not exists price_cents integer not null default 0,
  add column if not exists size text not null default '',
  add column if not exists occasion text[] not null default '{}',
  add column if not exists lead_time text not null default '',
  add column if not exists order_url text,
  add column if not exists featured boolean not null default false,
  add column if not exists is_active boolean not null default true;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'menu_items'
      and column_name = 'price'
  ) then
    begin
      execute $sql$
        update public.menu_items
        set price_cents = case
          when price_cents = 0 and price is not null
            then round((price::numeric) * 100)::integer
          else price_cents
        end
      $sql$;
    exception
      when others then
        null;
    end;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'menu_items'
      and column_name = 'category'
  ) then
    execute $sql$
      update public.menu_items
      set size = case
        when coalesce(nullif(size, ''), '') = '' and category is not null
          then category::text
        else size
      end
    $sql$;
  end if;
end;
$$;

update public.menu_items
set slug = trim(both '-' from regexp_replace(lower(coalesce(name, 'menu-item')), '[^a-z0-9]+', '-', 'g'))
          || '-' || substr(md5(id::text), 1, 8)
where slug is null or btrim(slug) = '';

update public.menu_items
set featured = false
where featured is null;

update public.menu_items
set is_active = true
where is_active is null;

alter table public.menu_items
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'menu_items'
      and constraint_name = 'menu_items_slug_key'
  ) then
    alter table public.menu_items
      add constraint menu_items_slug_key unique (slug);
  end if;
end;
$$;

commit;
