insert into public.menu_items
  (id, name, slug, description, price_cents, size, dietary, occasion, lead_time, image_url, featured, order_url)
values
  (
    'large-charcuterie-box',
    'Large Charcuterie Box',
    'large-charcuterie-box',
    'Our largest charcuterie box, styled for gifting, hosting, and easy pickup when you want a polished spread without full-service catering.',
    12000,
    'Large',
    array['Vegetarian Option', 'Gluten-Free Option'],
    array['Shower', 'Corporate', 'Gift'],
    '48 hours',
    '/food/charcuterie-spread.jpg',
    true,
    '/contact#quote-form'
  ),
  (
    'charcuterie-cups',
    'Charcuterie Cups',
    'charcuterie-cups',
    'Individual charcuterie cups priced per guest and designed for cocktail hours, school events, pop-ups, and grab-and-go hosting.',
    800,
    'Single',
    array['Vegetarian Option'],
    array['Corporate', 'Reception', 'Pop-up'],
    '48 hours',
    '/client/charcuterie-cup-detail.jpg',
    true,
    '/contact#quote-form'
  ),
  (
    'dirty-soda-4-pack',
    'Dirty Soda 4-Pack To-Go',
    'dirty-soda-4-pack-to-go',
    'A take-home four pack of signature dirty sodas, ready for gifting, event add-ons, or stocking the fridge before a gathering.',
    2500,
    '4-Pack',
    array['Custom Flavors'],
    array['Party', 'Gift', 'Pickup'],
    '24 hours',
    '/client/dirty-soda-and-charcuterie-box.jpg',
    true,
    '/contact#quote-form'
  )
on conflict (id) do nothing;

insert into public.events
  (id, title, date, location, description, image_url, join_url)
values
  (
    'river-market-spring-pop-up',
    'River Market Spring Pop-up',
    '2026-04-18T11:00:00-05:00',
    'Downtown Bentonville Square, Bentonville',
    'Stop by for charcuterie cups, dirty soda, and rotating cart specials from the menu.',
    '/client/cart-umbrella-wide.jpg',
    '/contact#quote-form'
  ),
  (
    'argenta-evening-market',
    'Argenta Evening Market',
    '2026-05-02T18:00:00-05:00',
    '8th Street Market, Bentonville',
    'An evening service built around charcuterie, dirty soda, and polished grab-and-go options for shoppers and guests.',
    '/client/cart-dirty-soda-hero.jpg',
    '/contact#quote-form'
  ),
  (
    'bridal-showcase',
    'Bridal Showcase Tasting',
    '2026-05-23T13:00:00-05:00',
    'Downtown Bentonville Event Loft',
    'A tasting experience for couples exploring charcuterie, mini pancake bar, bartending, and specialty cart service for wedding weekends.',
    '/client/dirty-soda-and-charcuterie-box.jpg',
    '/contact#quote-form'
  )
on conflict (id) do nothing;

insert into public.testimonials
  (id, name, occasion, quote)
values
  (
    'testimonial-1',
    'Madison R.',
    'Bridal Shower Host',
    'Every detail felt polished and intentional. The cart became part of the decor and the food disappeared in minutes.'
  ),
  (
    'testimonial-2',
    'Jordan T.',
    'Corporate Event Planner',
    'Professional, beautiful, and easy to work with. The Social Spread Cart made our client event feel elevated without stress.'
  ),
  (
    'testimonial-3',
    'Alicia W.',
    'Birthday Celebration',
    'The board styling was stunning and the flavors matched the presentation. Guests kept asking who created it.'
  )
on conflict (id) do nothing;
