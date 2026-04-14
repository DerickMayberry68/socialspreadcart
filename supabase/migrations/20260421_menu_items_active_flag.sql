begin;

alter table public.menu_items
  add column if not exists is_active boolean not null default true;

update public.menu_items
set is_active = true
where is_active is null;

commit;
