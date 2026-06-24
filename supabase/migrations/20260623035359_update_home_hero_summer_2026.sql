begin;

update public.marketing_page_content
set
  content = jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce(content, '{}'::jsonb),
        '{hero_main_image}',
        jsonb_build_object(
          'image_url', '/client/cart-coming-summer-2026.jpg',
          'alt_text', 'Mint green Social Spread Cart bus coming summer 2026'
        ),
        true
      ),
      '{hero_main_image_left_label}',
      to_jsonb('Coming summer 2026!'::text),
      true
    ),
    '{hero_main_image_right_label}',
    to_jsonb(''::text),
    true
  ),
  updated_at = now()
where page_key = 'home'
  and tenant_id = (
    select id
    from public.tenants
    where slug = 'shayley'
  );

commit;
