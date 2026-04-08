insert into public.menu_items
  (id, name, slug, description, price_cents, size, dietary, occasion, lead_time, image_url, featured, order_url)
values
  (
    'classic-brunch-board',
    'Classic Brunch Board',
    'classic-brunch-board',
    'A balanced spread of artisan cheeses, fresh fruit, breakfast pastries, and seasonal jam for effortless hosting.',
    13500,
    'Small',
    array['Vegetarian'],
    array['Brunch', 'Shower', 'Corporate'],
    '48 hours',
    '/brand/templates/template-10.svg',
    true,
    '/contact#quote-form'
  ),
  (
    'southern-garden-board',
    'Southern Garden Board',
    'southern-garden-board',
    'Herbed cheeses, honeycomb, pickled vegetables, crackers, and floral garnish designed for elegant daytime gatherings.',
    18500,
    'Medium',
    array['Vegetarian', 'Gluten-Free Option'],
    array['Birthday', 'Engagement', 'Girls Night'],
    '72 hours',
    '/brand/templates/template-8.svg',
    true,
    '/contact#quote-form'
  ),
  (
    'celebration-spread',
    'Celebration Spread',
    'celebration-spread',
    'A statement board with cured meats, imported cheeses, gourmet bites, fruit, nuts, and luxe finishing details.',
    26500,
    'Large',
    array['Gluten-Free Option'],
    array['Wedding', 'Corporate', 'Holiday'],
    '5 days',
    '/brand/templates/template-9.svg',
    true,
    '/contact#quote-form'
  ),
  (
    'petite-grazing-cups',
    'Petite Grazing Cups',
    'petite-grazing-cups',
    'Individually styled grazing cups for cocktail hours, pop-ups, and polished grab-and-go service.',
    7200,
    'Mini',
    array['Vegetarian Option'],
    array['Corporate', 'Pop-up', 'Reception'],
    '72 hours',
    '/brand/templates/template-6.svg',
    false,
    '/contact#quote-form'
  ),
  (
    'veggie-harvest-board',
    'Veggie Harvest Board',
    'veggie-harvest-board',
    'A produce-forward board with dips, marinated vegetables, nuts, berries, and gluten-free accompaniments.',
    16000,
    'Medium',
    array['Vegetarian', 'Gluten-Free'],
    array['Wellness', 'Corporate', 'Lunch'],
    '72 hours',
    '/brand/templates/template-2.svg',
    false,
    '/contact#quote-form'
  ),
  (
    'signature-sweets-board',
    'Signature Sweets Board',
    'signature-sweets-board',
    'A dessert-leaning board with macarons, chocolate, berries, and playful seasonal accents.',
    14500,
    'Medium',
    array['Vegetarian'],
    array['Birthday', 'Baby Shower', 'Holiday'],
    '72 hours',
    '/brand/templates/template-7.svg',
    false,
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
    'Stop by for signature grazing cups, take-home boards, and seasonal specials from the cart.',
    '/brand/templates/template-8.svg',
    '/contact#quote-form'
  ),
  (
    'argenta-evening-market',
    'Argenta Evening Market',
    '2026-05-02T18:00:00-05:00',
    '8th Street Market, Bentonville',
    'An evening cart service featuring sharable bites, sparkling pairings, and Mother''s Day gifting inspiration.',
    '/brand/templates/template-6.svg',
    '/contact#quote-form'
  ),
  (
    'bridal-showcase',
    'Bridal Showcase Tasting',
    '2026-05-23T13:00:00-05:00',
    'Downtown Bentonville Event Loft',
    'A curated tasting experience for couples exploring mobile charcuterie service for wedding weekends.',
    '/brand/templates/template-10.svg',
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
