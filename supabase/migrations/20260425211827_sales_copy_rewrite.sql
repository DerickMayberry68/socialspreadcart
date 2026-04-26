begin;

-- Home marketing page
update public.marketing_page_content
set
  content = jsonb_set(
    jsonb_set(
      jsonb_set(
        content,
        '{pillars}',
        '[{"title":"Premium presentation, simplified","body":"Enjoy clear booking options, beautiful presentation, and an easy ordering process straight from the start."},{"title":"A favorite for every guest","body":"Keep the party energized with beautiful charcuterie, refreshing drinks, and an irresistible presentation."},{"title":"Perfect for any occasion","body":"Whether it''s a shower, corporate launch, school event, or party, we have the perfect pickup or cart option for you."}]'::jsonb
      ),
      '{menu_section}',
      jsonb_set(
        jsonb_set(
          jsonb_set(
            coalesce(content->'menu_section', '{}'::jsonb),
            '{title}',
            '"Guest favorites, ready for pickup or event service."'
          ),
          '{description}',
          '"Select from our incredibly popular charcuterie, signature drinks, and event-ready snacks that your guests will absolutely love."'
        ),
        '{support_points}',
        '["Options crafted for showers, parties, launches, and school gatherings.", "Clear ordering options and dietary accommodations make scheduling a breeze.", "Enjoy flexible add-ons and party-sized portions to build exactly what you need."]'::jsonb
      )
    ),
    '{footer_cta_eyebrow}',
    '"Host an unforgettable event"'
  ),
  updated_at = now()
where page_key = 'home';

-- Update shell
update public.marketing_page_content
set
  content = jsonb_set(
    content,
    '{footer_cta_eyebrow}',
    '"Host an unforgettable event"'
  ),
  updated_at = now()
where page_key = 'shell';

-- Menu marketing page
update public.marketing_page_content
set
  content = content || jsonb_build_object(
    'title', 'Delicious pickup offerings for hosts who want premium local treats and easy ordering.',
    'description', 'Browse our most popular items and signature drinks, perfect for pickups, parties, and local events.',
    'intro_title', 'Signature items for quick ordering.',
    'intro_badge', 'Easy to choose'
  ),
  updated_at = now()
where page_key = 'menu';

-- About page
update public.about_page_content
set
  description = 'The Social Spread Cart is here to make your event unforgettable with incredible charcuterie, drinks, and snacks—always stress-free.',
  story_body = jsonb_build_array(
    'The Social Spread Cart brings a personal, premium touch to your event that standard catering can''t match. Every order is crafted to delight your guests.',
    'From take-home orders to full event setups, the current offer centers on large charcuterie boxes, charcuterie cups, dirty soda, and a small set of cart services including a mini pancake bar, bartending, and event-ready station setups.',
    'We serve Bentonville and nearby Northwest Arkansas communities with pickup items, local delivery, and on-site cart experiences.'
  ),
  updated_at = now();

update public.about_feature_cards
set
  title = 'Simplified hosting',
  body = 'An easy ordering process and friendly service means you skip the stress before guests arrive.',
  updated_at = now()
where display_order = 1;

update public.about_feature_cards
set
  title = 'Premium presentation',
  body = 'Colorful drinks, gourmet boards, and cheerful service bring incredible energy to your table.',
  updated_at = now()
where display_order = 2;

commit;
