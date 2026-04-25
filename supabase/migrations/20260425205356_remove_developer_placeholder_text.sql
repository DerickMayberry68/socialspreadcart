-- Remove developer placeholder text ("managed through Supabase...") from the events marketing page content
begin;

update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'cards', jsonb_build_array(
      jsonb_build_object('eyebrow', 'Easy to scan', 'body', 'Dates, locations, and details are listed up front so you can plan quickly.'),
      jsonb_build_object('eyebrow', 'Always current', 'body', 'We regularly update our calendar with new dates and locations so you never miss a chance to catch the cart.'),
      jsonb_build_object('eyebrow', 'Check back anytime', 'body', 'Watch for pop-ups, tastings, and seasonal menu moments around Northwest Arkansas.')
    )
  ),
  updated_at = now()
where page_key = 'events';

commit;
