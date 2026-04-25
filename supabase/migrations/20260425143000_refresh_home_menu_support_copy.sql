-- Refresh legacy strategy-facing home page copy with customer-facing
-- hosting copy for existing editable content rows.

begin;

update public.marketing_page_content
set
  content = content
    || jsonb_build_object(
      'pillars',
      jsonb_build_array(
        jsonb_build_object(
          'title', 'Beautiful, without the stress',
          'body', 'Clear lead times, thoughtful presentation, and simple booking details help you feel prepared from the start.'
        ),
        jsonb_build_object(
          'title', 'Made for memorable moments',
          'body', 'Colorful drinks, generous grazing, and styled setups give guests something fun to gather around.'
        ),
        jsonb_build_object(
          'title', 'Flexible for real hosting',
          'body', 'Choose pickup, local delivery, or full cart service for showers, launches, school events, parties, and more.'
        )
      ),
      'menu_section',
      coalesce(content->'menu_section', '{}'::jsonb)
        || jsonb_build_object(
          'title', 'Guest favorites, ready for pickup or event service.',
          'description', 'Choose from crowd-pleasing charcuterie, colorful drinks, and guest-friendly add-ons that feel special without making hosting complicated.',
          'support_eyebrow', 'Made for Easy Hosting',
          'support_title', 'Favorites that feel polished without making planning harder.',
          'support_points', jsonb_build_array(
            'Styled grazing and drink options bring a special-event feel to showers, parties, launches, and school gatherings.',
            'Clear lead times and dietary notes help you plan pickup, delivery, or cart service with confidence.',
            'Guest-friendly portions and flexible add-ons make it easier to choose the right fit for your event.'
          )
        ),
      'pathway_section',
      coalesce(content->'pathway_section', '{}'::jsonb)
        || jsonb_build_object(
          'eyebrow', 'Ways to Order',
          'title', 'Choose the service style that fits your plans.',
          'description', 'Order a polished pickup, bring the cart to your event, or catch us at a local pop-up around Northwest Arkansas.'
        ),
      'booking_section',
      coalesce(content->'booking_section', '{}'::jsonb)
        || jsonb_build_object(
          'eyebrow', 'How It Works',
          'title', 'Simple planning for a polished event day.',
          'description', 'From the first inquiry to the final setup, we keep the next step clear so you can plan with confidence.',
          'cards', jsonb_build_array(
            jsonb_build_object(
              'title', 'Clear lead times',
              'body', 'Know what needs 24 to 48 hours, what may need more planning, and when to reach out for larger events.'
            ),
            jsonb_build_object(
              'title', 'Local event support',
              'body', 'We serve Bentonville and nearby Northwest Arkansas communities with pickup, delivery, and on-site cart service.'
            ),
            jsonb_build_object(
              'title', 'Styled, welcoming, and easy to enjoy',
              'body', 'Every setup is designed to look beautiful, feel inviting, and keep guests moving comfortably through the experience.'
            )
          )
        ),
      'events_section',
      coalesce(content->'events_section', '{}'::jsonb)
        || jsonb_build_object(
          'title', 'Find us at pop-ups, tastings, and community events.',
          'description', 'Watch for upcoming dates around Northwest Arkansas where you can grab signature sips, charcuterie cups, and seasonal favorites.'
        ),
      'testimonials_section',
      coalesce(content->'testimonials_section', '{}'::jsonb)
        || jsonb_build_object(
          'title', 'Hosts remember the details, and guests do too.',
          'description', 'From polished presentation to easy planning, past clients share what made their event feel special.'
        ),
      'final_cta',
      coalesce(content->'final_cta', '{}'::jsonb)
        || jsonb_build_object(
          'title', 'Bring polished snacks, signature sips, and easy hospitality to your next event.'
        )
    ),
  updated_at = now()
where page_key = 'home';

commit;
