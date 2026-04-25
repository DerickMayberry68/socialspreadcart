-- Replace strategy/design-facing marketing copy with plainer
-- customer-facing wording in editable content tables.

begin;

update public.hero_content
set
  headline = 'Snacks, sips, and cart service for Northwest Arkansas events.',
  body = 'The Social Spread Cart brings charcuterie, dirty soda, mini pancakes, bartending, and ice cream toppings to pickups, parties, and local events.',
  updated_at = now()
where headline = 'An elevated approach to hosting, designed to be experienced.'
   or body like '%host effortlessly%';

update public.pathway_cards
set
  body = 'Order boxes, charcuterie cups, and bundles when you want something special without full-service catering.',
  updated_at = now()
where display_order = 1
  and body = 'Order polished boxes, charcuterie cups, and bundles when you want something special without full-service catering.';

update public.menu_items
set description = 'Our largest charcuterie box for gifting, hosting, and easy pickup when you want a generous spread without full-service catering.'
where id = 'large-charcuterie-box'
  and description = 'Our largest charcuterie box, styled for gifting, hosting, and easy pickup when you want a polished presentation without full-service catering.';

update public.menu_items
set description = 'Individual charcuterie cups priced per guest for cocktail hours, school events, pop-ups, and grab-and-go hosting.'
where id = 'charcuterie-cups'
  and description = 'Individual charcuterie cups priced per guest and designed for cocktail hours, school events, pop-ups, and grab-and-go hosting.';

update public.events
set description = 'An evening service with charcuterie, dirty soda, and grab-and-go options for shoppers and guests.'
where id = 'argenta-evening-market'
  and description = 'An evening service built around charcuterie, dirty soda, and polished grab-and-go options for shoppers and guests.';

update public.events
set description = 'A tasting for couples exploring charcuterie, mini pancake bar, bartending, and specialty cart service for wedding weekends.'
where id = 'bridal-showcase'
  and description = 'A tasting experience for couples exploring charcuterie, mini pancake bar, bartending, and specialty cart service for wedding weekends.';

update public.testimonials
set quote = 'Everything was ready when guests arrived. The cart became part of the decor and the food disappeared in minutes.'
where id = 'testimonial-1'
  and quote = 'Every detail felt polished and intentional. The cart became part of the decor and the food disappeared in minutes.';

update public.testimonials
set quote = 'Professional, beautiful, and easy to work with. The Social Spread Cart made our client event feel special without stress.'
where id = 'testimonial-2'
  and quote = 'Professional, beautiful, and easy to work with. The Social Spread Cart made our client event feel elevated without stress.';

update public.gallery_section_content
set
  description = 'Browse real cart service, drinks, grazing tables, and event setups from The Social Spread Cart.',
  feature_card_eyebrow = 'What you will see',
  feature_card_title = 'Real setups, colorful drinks, grazing details, and cart service moments.',
  support_card_body = 'Use the gallery to picture pickup orders, cart service, and menu details for your own event.',
  updated_at = now()
where description like '%aesthetic direction%'
   or feature_card_eyebrow = 'What the gallery should do';

update public.about_page_content
set
  title = 'A Bentonville cart serving cheerful snacks, sips, and event-ready grazing.',
  story_title = 'Charcuterie, dirty soda, and cart service for hosts across Northwest Arkansas.',
  story_body = jsonb_build_array(
    'The Social Spread Cart was created for hosts who want something more personal than standard catering. Menus and cart setups are planned to be approachable, generous, and easy for guests to enjoy.',
    'From take-home orders to full event setups, the current offer centers on large charcuterie boxes, charcuterie cups, dirty soda, and a small set of cart services including a mini pancake bar, bartending, and event-ready station setups.',
    'We serve Bentonville and nearby Northwest Arkansas communities with pickup items, local delivery, and on-site cart experiences.'
  ),
  updated_at = now()
where title like '%polished%'
   or story_body::text like '%intentional%';

update public.about_feature_cards
set
  body = 'Clear planning and friendly service help hosts feel ready before guests arrive.',
  updated_at = now()
where display_order = 1
  and body = 'The experience should feel easy for the host and welcoming for every guest.';

update public.about_feature_cards
set
  title = 'Bright details',
  body = 'Colorful drinks, generous boards, and cheerful service bring energy to the table.',
  updated_at = now()
where display_order = 2
  and title = 'Playful polish';

update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'header_top_right', 'Host-friendly favorites for gatherings of every size',
    'footer_description', 'A mobile snack and beverage cart serving Bentonville and the wider NWA area with charcuterie boxes, charcuterie cups, dirty soda, mini pancake bar service, and event setups.'
  ),
  updated_at = now()
where page_key = 'shell';

update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'hero_feature_title', 'Generous grazing for parties, showers, and local events.',
    'pillars', jsonb_build_array(
      jsonb_build_object('title', 'Good food, clearly planned', 'body', 'Clear lead times, thoughtful presentation, and simple booking details help you feel prepared from the start.'),
      jsonb_build_object('title', 'Easy for guests to enjoy', 'body', 'Colorful drinks, generous grazing, and friendly service give guests something fun to gather around.'),
      jsonb_build_object('title', 'Flexible for real hosting', 'body', 'Choose pickup, local delivery, or full cart service for showers, launches, school events, parties, and more.')
    ),
    'menu_section', coalesce(content->'menu_section', '{}'::jsonb) || jsonb_build_object(
      'support_title', 'Favorites that make hosting easier.',
      'support_points', jsonb_build_array(
        'Grazing and drink options fit showers, parties, launches, and school gatherings.',
        'Clear lead times and dietary notes help you plan pickup, delivery, or cart service with confidence.',
        'Guest-friendly portions and flexible add-ons make it easier to choose the right fit for your event.'
      )
    ),
    'pathway_section', coalesce(content->'pathway_section', '{}'::jsonb) || jsonb_build_object(
      'description', 'Order pickup, bring the cart to your event, or catch us at a local pop-up around Northwest Arkansas.'
    ),
    'booking_section', coalesce(content->'booking_section', '{}'::jsonb) || jsonb_build_object(
      'title', 'Simple planning for event day.',
      'cards', jsonb_build_array(
        jsonb_build_object('title', 'Clear lead times', 'body', 'Know what needs 24 to 48 hours, what may need more planning, and when to reach out for larger events.'),
        jsonb_build_object('title', 'Local event support', 'body', 'We serve Bentonville and nearby Northwest Arkansas communities with pickup, delivery, and on-site cart service.'),
        jsonb_build_object('title', 'Welcoming and easy to enjoy', 'body', 'Each setup is arranged for easy serving, clear flow, and a table or cart guests want to visit.')
      )
    ),
    'testimonials_section', coalesce(content->'testimonials_section', '{}'::jsonb) || jsonb_build_object(
      'description', 'Past clients share what made ordering, setup, and serving feel simple.'
    ),
    'final_cta', coalesce(content->'final_cta', '{}'::jsonb) || jsonb_build_object(
      'title', 'Bring snacks, signature sips, and easy hospitality to your next event.',
      'description', 'Whether you need a pickup order or a cart at your event, the next step is simple.'
    )
  ),
  updated_at = now()
where page_key = 'home';

update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'title', 'Current pickup offerings for hosts who want something colorful and easy to order.',
    'description', 'The menu focuses on guest-friendly favorites for pickups, parties, and local events.',
    'intro_badge', 'Easy to choose',
    'intro_title', 'A focused menu for simple ordering.',
    'intro_body', 'Most orders require 24 to 48 hours of notice, and the best sellers are built to travel well and make hosting easier.'
  ),
  updated_at = now()
where page_key = 'menu';

update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'description', 'Find upcoming pop-ups, tastings, and local events where you can try seasonal favorites.',
    'cards', jsonb_build_array(
      jsonb_build_object('eyebrow', 'Easy to scan', 'body', 'Dates, locations, and details are listed up front so you can plan quickly.'),
      jsonb_build_object('eyebrow', 'Always current', 'body', 'Dates are managed through Supabase so future events can be added quickly by the admin team.'),
      jsonb_build_object('eyebrow', 'Check back anytime', 'body', 'Watch for pop-ups, tastings, and seasonal menu moments around Northwest Arkansas.')
    )
  ),
  updated_at = now()
where page_key = 'events';

update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'title', 'A mobile snack and beverage cart for parties, school events, markets, and private gatherings.',
    'description', 'Book the cart for showers, birthdays, open houses, launch events, markets, and corporate socials across Northwest Arkansas.'
  ),
  updated_at = now()
where page_key = 'cart-service';

create or replace function public.seed_site_content_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.site_configuration
    (tenant_id, brand_name, brand_tagline, booking_cta_label,
     booking_cta_target, support_phone, support_email)
  values
    (NEW.id, coalesce(NEW.name, 'Your Brand'), '', 'Book the Cart',
     '/contact', null, null)
  on conflict (tenant_id) do nothing;

  insert into public.hero_content
    (tenant_id, headline, sub_line, body, primary_cta_label,
     primary_cta_target, secondary_cta_label, secondary_cta_target)
  values
    (NEW.id,
     'Snacks, sips, and cart service for Northwest Arkansas events.',
     'Snacks & sips, served your way.',
     'The Social Spread Cart brings charcuterie, dirty soda, mini pancakes, bartending, and ice cream toppings to pickups, parties, and local events.',
     'Start Your Order', '/contact', 'Browse the Menu', '/menu')
  on conflict (tenant_id) do nothing;

  insert into public.pathway_cards
    (tenant_id, display_order, title, body, badge, link_target, image_url)
  values
    (NEW.id, 1, 'Pickup for gifting and easy hosting',
     'Order boxes, charcuterie cups, and bundles when you want something special without full-service catering.',
     'Fastest path', '/menu', '/food/charcuterie-spread.jpg'),
    (NEW.id, 2, 'Cart service that becomes part of the decor',
     'A styled setup for showers, weddings, community activations, school events, and private gatherings that deserve a focal point.',
     'Event favorite', '/contact', '/client/cart-umbrella-wide.jpg'),
    (NEW.id, 3, 'Pop-ups worth planning around',
     'Keep an eye on public events for signature sips, grab-and-go bites, and seasonal specials around Northwest Arkansas.',
     'Community favorite', '/events', '/client/cart-dirty-soda-hero.jpg')
  on conflict (tenant_id, display_order) do nothing;

  return NEW;
end;
$$;

create or replace function public.seed_gallery_content_for_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gallery_section_content
    (tenant_id, eyebrow, title, description, feature_card_eyebrow,
     feature_card_title, support_card_body)
  values
    (NEW.id, 'Gallery',
     'A visual library of real cart service, drinks, grazing, and event-ready moments.',
     'Browse real cart service, drinks, grazing tables, and event setups from The Social Spread Cart.',
     'What you will see',
     'Real setups, colorful drinks, grazing details, and cart service moments.',
     'Use the gallery to picture pickup orders, cart service, and menu details for your own event.')
  on conflict (tenant_id) do nothing;

  insert into public.gallery_images
    (tenant_id, display_order, title, eyebrow, alt_text, image_url)
  values
    (NEW.id, 1,
     'Dirty soda service from the cart',
     'Cart Service',
     'Dirty soda service from the cart',
     '/client/cart-dirty-soda-hero.jpg'),
    (NEW.id, 2,
     'A mini pancake bar styled for brunches, showers, and event-day service',
     'Mini Pancake Bar',
     'A mini pancake bar styled for brunches, showers, and event-day service',
     '/client/mini-pancake-bar.jpg'),
    (NEW.id, 3,
     'Grab-and-go charcuterie cups for pop-ups and parties',
     'Charcuterie Cups',
     'Grab-and-go charcuterie cups for pop-ups and parties',
     '/client/charcuterie-cup-closeup.jpg'),
    (NEW.id, 4,
     'The cart setup ready for a real event day',
     'Event Setup',
     'The cart setup ready for a real event day',
     '/client/cart-umbrella-wide.jpg'),
    (NEW.id, 5,
     'Snack box styling paired with a bright drink',
     'Snack + Sip',
     'Snack box styling paired with a bright drink',
     '/client/dirty-soda-and-charcuterie-box.jpg'),
    (NEW.id, 6,
     'A close-up charcuterie moment for grazing service',
     'Charcuterie',
     'A close-up charcuterie moment for grazing service',
     '/client/charcuterie-cup-detail.jpg')
  on conflict (tenant_id, display_order) do nothing;

  return NEW;
end;
$$;

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
     'A Bentonville cart serving cheerful snacks, sips, and event-ready grazing.',
     'The Social Spread Cart exists for hosts who want the event to feel thoughtful and memorable without adding more stress to the planning process.',
     'Bentonville based',
     'Charcuterie, dirty soda, and cart service for hosts across Northwest Arkansas.',
     jsonb_build_array(
       'The Social Spread Cart was created for hosts who want something more personal than standard catering. Menus and cart setups are planned to be approachable, generous, and easy for guests to enjoy.',
       'From take-home orders to full event setups, the current offer centers on large charcuterie boxes, charcuterie cups, dirty soda, and a small set of cart services including a mini pancake bar, bartending, and event-ready station setups.',
       'We serve Bentonville and nearby Northwest Arkansas communities with pickup items, local delivery, and on-site cart experiences.'
     ))
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
    (NEW.id, 1, 'Approachable service', 'Clear planning and friendly service help hosts feel ready before guests arrive.', 'heart-handshake'),
    (NEW.id, 2, 'Bright details', 'Colorful drinks, generous boards, and cheerful service bring energy to the table.', 'sparkles'),
    (NEW.id, 3, 'Locally rooted', 'Built for Bentonville and the wider Northwest Arkansas event scene.', 'map-pin')
  on conflict (tenant_id, display_order) do nothing;

  return NEW;
end;
$$;

commit;
