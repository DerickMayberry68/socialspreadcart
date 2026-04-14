begin;

update public.tenants
set slug = 'shayley',
    updated_at = now()
where slug = 'sarah'
  and not exists (
    select 1
    from public.tenants existing
    where existing.slug = 'shayley'
  );

commit;
