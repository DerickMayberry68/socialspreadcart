update public.marketing_page_content
set
  content = jsonb_set(
    content,
    '{navigation}',
    coalesce(
      (
        select jsonb_agg(item)
        from jsonb_array_elements(content->'navigation') as item
        where item->>'href' <> '/contact'
      ),
      '[]'::jsonb
    ),
    true
  ),
  updated_at = now()
where page_key = 'shell'
  and jsonb_typeof(content->'navigation') = 'array'
  and exists (
    select 1
    from jsonb_array_elements(content->'navigation') as item
    where item->>'href' = '/contact'
  );
