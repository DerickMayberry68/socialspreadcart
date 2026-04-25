import { cartGallery, clientMedia, foodMedia } from "@/lib/media";
import { cartHighlights } from "@/lib/fallback-data";
import { navigation, siteConfig } from "@/lib/site";
import type {
  CartServicePageMarketingContent,
  ContactPageMarketingContent,
  EventsPageMarketingContent,
  HomePageMarketingContent,
  MarketingPageContentByKey,
  MarketingPageKey,
  MenuPageMarketingContent,
  ShellMarketingContent,
} from "@/lib/types/site-content";

export const DEFAULT_SHELL_MARKETING_CONTENT: ShellMarketingContent = {
  navigation: navigation.map((item) => ({ ...item })),
  header_top_left: "Bentonville - Pickup, delivery, and styled cart service",
  header_top_right: "Host-friendly favorites for gatherings of every size",
  booking_cta_label: "Book the Cart",
  booking_cta_target: "/contact",
  footer_cta_eyebrow: "Let's make hosting feel lovely",
  footer_cta_title:
    "Warm hospitality, joyful details, and a setup guests remember.",
  footer_description:
    "A mobile snack and beverage cart serving Bentonville and the wider NWA area with charcuterie boxes, charcuterie cups, dirty soda, mini pancake bar service, and event setups.",
  location: siteConfig.location,
  phone: siteConfig.phone,
  email: siteConfig.email,
  instagram_label: "@thesocialspreadcart",
  instagram_url: siteConfig.instagram,
};

export const DEFAULT_HOME_MARKETING_CONTENT: HomePageMarketingContent = {
  hero_badge: "Premium cart hospitality in Northwest Arkansas",
  hero_kicker: "Charcuterie boxes - dirty soda - styled cart service",
  hero_main_image: {
    image_url: clientMedia.cartDirtySodaHero,
    alt_text: "Dirty soda service from The Social Spread Cart",
  },
  hero_main_image_left_label: "Host favorite",
  hero_main_image_right_label: "Bentonville, AR",
  hero_feature_image: {
    image_url: foodMedia.charcuterieBox,
    alt_text: "Charcuterie box",
  },
  hero_feature_eyebrow: "Best seller",
  hero_feature_title: "Generous grazing for parties, showers, and local events.",
  hero_service_cards: [
    "Pickup, delivery, or full event setup",
    "Colorful cart moments guests remember",
  ],
  proof_stats: [
    { label: "Pickup Favorites", value: "48 hr", note: "for most best sellers" },
    { label: "Guest-Friendly", value: "Dietary", note: "clear notes on popular items" },
    { label: "Serving", value: "NWA", note: "Bentonville and nearby communities" },
  ],
  pillars: [
    {
      title: "Good food, clearly planned",
      body:
        "Clear lead times, thoughtful presentation, and simple booking details help you feel prepared from the start.",
    },
    {
      title: "Easy for guests to enjoy",
      body:
        "Colorful drinks, generous grazing, and friendly service give guests something fun to gather around.",
    },
    {
      title: "Flexible for real hosting",
      body:
        "Choose pickup, local delivery, or full cart service for showers, launches, school events, parties, and more.",
    },
  ],
  menu_section: {
    eyebrow: "Signature Favorites",
    title: "Guest favorites, ready for pickup or event service.",
    description:
      "Choose from crowd-pleasing charcuterie, colorful drinks, and guest-friendly add-ons that feel special without making hosting complicated.",
    support_eyebrow: "Made for Easy Hosting",
    support_title: "Favorites that make hosting easier.",
    support_points: [
      "Grazing and drink options fit showers, parties, launches, and school gatherings.",
      "Clear lead times and dietary notes help you plan pickup, delivery, or cart service with confidence.",
      "Guest-friendly portions and flexible add-ons make it easier to choose the right fit for your event.",
    ],
    cta_label: "See the Full Menu",
    cta_target: "/menu",
  },
  pathway_section: {
    eyebrow: "Ways to Order",
    title: "Choose the service style that fits your plans.",
    description:
      "Order pickup, bring the cart to your event, or catch us at a local pop-up around Northwest Arkansas.",
  },
  booking_section: {
    eyebrow: "How It Works",
    title: "Simple planning for event day.",
    description:
      "From the first inquiry to the final setup, we keep the next step clear so you can plan with confidence.",
    steps: [
      "Choose pickup, delivery, or full cart service.",
      "Select the menu mix that fits your guest count and the feel of the event.",
      "We confirm timing, setup, and presentation so hosting feels lighter.",
    ],
    cards: [
      {
        title: "Clear lead times",
        body:
          "Know what needs 24 to 48 hours, what may need more planning, and when to reach out for larger events.",
      },
      {
        title: "Local event support",
        body:
          "We serve Bentonville and nearby Northwest Arkansas communities with pickup, delivery, and on-site cart service.",
      },
      {
        title: "Welcoming and easy to enjoy",
        body:
          "Each setup is arranged for easy serving, clear flow, and a table or cart guests want to visit.",
      },
    ],
  },
  cart_section: {
    eyebrow: "Cart Experience",
    title: "A mobile cart that feels like part hospitality, part atmosphere.",
    description:
      "Bring the cart on site for colorful drinks, grazing service, and a friendly setup guests can visit throughout the event.",
    highlights: [...cartHighlights],
    cta_label: "Explore Cart Service",
    cta_target: "/cart-service",
  },
  events_section: {
    eyebrow: "Upcoming Pop-Ups",
    title: "Find us at pop-ups, tastings, and community events.",
    description:
      "Watch for upcoming dates around Northwest Arkansas where you can grab signature sips, charcuterie cups, and seasonal favorites.",
    cta_label: "View Events Calendar",
    cta_target: "/events",
  },
  testimonials_section: {
    eyebrow: "Kind Words",
    title: "Hosts remember the details, and guests do too.",
    description:
      "Past clients share what made ordering, setup, and serving feel simple.",
  },
  final_cta: {
    eyebrow: "Ready to book?",
    title:
      "Bring snacks, signature sips, and easy hospitality to your next event.",
    description:
      "Whether you need a pickup order or a cart at your event, the next step is simple.",
    secondary_cta_label: "See Menu Options",
    secondary_cta_target: "/menu",
  },
};

export const DEFAULT_MENU_PAGE_MARKETING_CONTENT: MenuPageMarketingContent = {
  eyebrow: "Menu",
  title:
    "Current pickup offerings for hosts who want something colorful and easy to order.",
  description:
    "The menu focuses on guest-friendly favorites for pickups, parties, and local events.",
  intro_badge: "Easy to choose",
  intro_title: "A focused menu for simple ordering.",
  intro_body:
    "Most orders require 24 to 48 hours of notice, and the best sellers are built to travel well and make hosting easier.",
  cards: [
    {
      title: "Pickup",
      body:
        "Ideal for hosts who want ready-to-enjoy snacks, drinks, and shareables with a simple handoff.",
    },
    {
      title: "Delivery",
      body:
        "Available in Bentonville and surrounding areas, with timing coordinated for event-day ease.",
    },
    {
      title: "Lead Times",
      body:
        "Cart bookings and larger event orders may require additional planning time beyond standard menu favorites.",
    },
  ],
};

export const DEFAULT_EVENTS_PAGE_MARKETING_CONTENT: EventsPageMarketingContent = {
  eyebrow: "Events Calendar",
  title: "Keep up with public pop-ups, tastings, and upcoming appearances.",
  description:
    "Find upcoming pop-ups, tastings, and local events where you can try seasonal favorites.",
  cards: [
    {
      eyebrow: "Easy to scan",
      body:
        "Dates, locations, and details are listed up front so you can plan quickly.",
    },
    {
      eyebrow: "Always current",
      body:
        "Dates are managed through Supabase so future events can be added quickly by the admin team.",
    },
    {
      eyebrow: "Check back anytime",
      body:
        "Watch for pop-ups, tastings, and seasonal menu moments around Northwest Arkansas.",
    },
  ],
};

export const DEFAULT_CART_SERVICE_PAGE_MARKETING_CONTENT: CartServicePageMarketingContent = {
  eyebrow: "The Cart Service",
  title:
    "A mobile snack and beverage cart for parties, school events, markets, and private gatherings.",
  description:
    "Book the cart for showers, birthdays, open houses, launch events, markets, and corporate socials across Northwest Arkansas.",
  gallery: cartGallery.map((imageUrl, index) => ({
    image_url: imageUrl,
    alt_text:
      [
        "The Social Spread Cart event service",
        "Dirty soda service from The Social Spread Cart",
        "Mini pancake bar styled for event service",
        "Dirty soda and charcuterie box styling",
      ][index] ?? "The Social Spread Cart event service",
  })),
  included_title: "What is included",
  highlights: [...cartHighlights],
  service_chips: [
    "Dirty soda service",
    "Charcuterie service",
    "Mini pancake bar",
    "Bartending service",
    "Ice cream toppings bar",
  ],
  cta_label: "Get a Quote",
  cta_target: "/contact#quote-form",
};

export const DEFAULT_CONTACT_PAGE_MARKETING_CONTENT: ContactPageMarketingContent = {
  eyebrow: "Contact and Quotes",
  title: "Tell us about the date, guest count, and feeling you want the event to have.",
  description:
    "We use your inquiry to recommend the right mix of charcuterie boxes, cups, dirty soda, mini pancake bar service, bartending, or cart service.",
  planning_title: "Let's plan it",
  planning_body:
    "Smaller menu orders usually require 48 to 72 hours of notice. Cart service and larger event bookings are best booked as early as possible.",
  contact_cards: [
    { label: "Location", value: siteConfig.location },
    { label: "Phone", value: siteConfig.phone },
    { label: "Email", value: siteConfig.email },
    {
      label: "What to expect",
      value:
        "We will follow up with availability, next steps, and the best fit for your event.",
    },
  ],
  quote_form: {
    success_title: "Thank you",
    success_body:
      "We received your inquiry and will follow up with next steps, availability, and a tailored recommendation.",
    success_button_label: "Submit another inquiry",
    header_eyebrow: "Inquiry details",
    header_title: "Tell us what you are planning",
    header_description:
      "The more context you share, the better we can recommend the right mix of menu favorites and cart service.",
    header_badge: "Response-friendly form",
    name_label: "Name",
    email_label: "Email",
    phone_label: "Phone",
    event_date_label: "Event Date",
    event_type_label: "Event Type",
    event_type_placeholder: "Select event type",
    guests_label: "Number of Guests",
    services_label: "Services Needed",
    message_label: "Message",
    message_optional_label: "(optional)",
    message_placeholder:
      "Tell us about your venue, timing, guest flow, or the overall mood you are hoping to create.",
    submit_label: "Request My Quote",
    submitting_label: "Sending...",
  },
};

export const DEFAULT_MARKETING_PAGE_CONTENT: MarketingPageContentByKey = {
  shell: DEFAULT_SHELL_MARKETING_CONTENT,
  home: DEFAULT_HOME_MARKETING_CONTENT,
  menu: DEFAULT_MENU_PAGE_MARKETING_CONTENT,
  events: DEFAULT_EVENTS_PAGE_MARKETING_CONTENT,
  "cart-service": DEFAULT_CART_SERVICE_PAGE_MARKETING_CONTENT,
  contact: DEFAULT_CONTACT_PAGE_MARKETING_CONTENT,
};

export const MARKETING_PAGE_KEYS = Object.keys(
  DEFAULT_MARKETING_PAGE_CONTENT,
) as MarketingPageKey[];
