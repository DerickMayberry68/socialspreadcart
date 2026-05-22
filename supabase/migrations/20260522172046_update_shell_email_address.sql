update public.marketing_page_content
set
  content = jsonb_set(
    content,
    '{email}',
    to_jsonb('info@socialspreadnwa.com'::text),
    true
  ),
  updated_at = now()
where page_key = 'shell'
  and content->>'email' = 'info@socialspreadcart.com';
