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
  header_top_right: "Host-friendly favorites with playful polish",
  booking_cta_label: "Book the Cart",
  booking_cta_target: "/contact",
  footer_cta_eyebrow: "Let's make hosting feel lovely",
  footer_cta_title:
    "Warm hospitality, joyful details, and a setup guests remember.",
  footer_description:
    "A mobile snack and beverage cart serving Bentonville and the wider NWA area with charcuterie boxes, charcuterie cups, dirty soda, mini pancake bar service, and polished event setups.",
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
  hero_feature_title: "Grazing that feels elevated, abundant, and easy.",
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
      title: "Elegant enough to trust",
      body:
        "Clear lead times, polished presentation, and straightforward booking details make the experience feel reassuring from the first scroll.",
    },
    {
      title: "Joyful enough to share",
      body:
        "Colorful drinks, generous grazing, and cheerful photography bring a bright premium energy without losing calm.",
    },
    {
      title: "Flexible enough for real hosting",
      body:
        "Pickup, delivery, and full cart service let customers find the right level of support for showers, launches, school events, and parties.",
    },
  ],
  menu_section: {
    eyebrow: "Signature Favorites",
    title: "Merchandised like a treat, explained like a service you can trust.",
    description:
      "The menu stays intentionally focused: crowd-pleasing charcuterie, colorful drinks, and guest-friendly add-ons that feel special without becoming complicated.",
    support_eyebrow: "Why this works",
    support_title: "Clear choices, real imagery, and guest-ready expectations.",
    support_points: [
      "Real-event photography shows the feeling instead of relying on generic catering tropes.",
      "Lead times and dietary notes appear early, which lowers hesitation.",
      "Pickup favorites and event service sit side by side so shoppers can self-sort quickly.",
    ],
    cta_label: "See the Full Menu",
    cta_target: "/menu",
  },
  pathway_section: {
    eyebrow: "How People Shop Us",
    title: "One brand, several easy ways to say yes.",
    description:
      "The site now guides customers naturally whether they need a small pickup order, a styled cart service, or a reason to visit a pop-up.",
  },
  booking_section: {
    eyebrow: "The Booking Feeling",
    title: "Calm enough for planners, colorful enough for guests.",
    description:
      "Borrowing from wellness brands, the experience reduces stress through simple offers, straightforward steps, and copy that answers the question before it becomes friction.",
    steps: [
      "Choose pickup, delivery, or a full cart service experience.",
      "Select the menu mix that fits your guest count and the feel of the event.",
      "We confirm timing, setup, and presentation so hosting feels lighter.",
    ],
    cards: [
      {
        title: "Transparent lead times",
        body:
          "Premium brands feel more trustworthy when timing expectations are visible instead of hidden behind vague inquiry language.",
      },
      {
        title: "Local and event-ready",
        body:
          "Location cues, event imagery, and clear service formats make the brand feel rooted, real, and easy to picture in a host's day.",
      },
      {
        title: "Editorial enough to feel premium without losing approachability.",
        body:
          "More white space, stronger trust framing, and brighter merchandising make the site feel upscale while still playful and easy to shop.",
      },
    ],
  },
  cart_section: {
    eyebrow: "Cart Experience",
    title: "A mobile cart that feels like part hospitality, part atmosphere.",
    description:
      "This is where the playful energy shows up most: curated menus, upbeat color, and a setup that gives events an instant focal point.",
    highlights: [...cartHighlights],
    cta_label: "Explore Cart Service",
    cta_target: "/cart-service",
  },
  events_section: {
    eyebrow: "Upcoming Pop-Ups",
    title: "Public events stay easy to scan and easy to remember.",
    description:
      "A cleaner event rhythm keeps the brand feeling alive between private bookings and gives returning customers a reason to check back.",
    cta_label: "View Events Calendar",
    cta_target: "/events",
  },
  testimonials_section: {
    eyebrow: "Kind Words",
    title: "The trust section should feel as polished as the product.",
    description:
      "Testimonials work harder when the layout gives them space, warmth, and a little ceremony.",
  },
  final_cta: {
    eyebrow: "Ready to book?",
    title:
      "Build a menu that feels trustworthy, celebratory, and easy to say yes to.",
    description:
      "Whether you need a polished pickup order or a cart that becomes part of the event, the next step is simple.",
    secondary_cta_label: "See Menu Options",
    secondary_cta_target: "/menu",
  },
};

export const DEFAULT_MENU_PAGE_MARKETING_CONTENT: MenuPageMarketingContent = {
  eyebrow: "Menu",
  title:
    "Current pickup offerings for hosts who want something polished, colorful, and easy to order.",
  description:
    "The menu focuses on a few high-confidence favorites so the experience feels curated rather than crowded.",
  intro_badge: "Designed for quick decisions",
  intro_title: "The best version of the menu feels edited, not endless.",
  intro_body:
    "Most orders require 24 to 48 hours of notice, and the best sellers are built to travel well, photograph beautifully, and make hosting feel easier.",
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
    "A live events rhythm makes the brand feel active between private bookings and gives returning guests a reason to keep checking in.",
  cards: [
    {
      eyebrow: "Easy to scan",
      body:
        "Public events should feel discoverable at a glance, even for busy hosts planning around family or work schedules.",
    },
    {
      eyebrow: "Always current",
      body:
        "Dates are managed through Supabase so future events can be added quickly by the admin team.",
    },
    {
      eyebrow: "Made for return visits",
      body:
        "This page gives loyal customers a simple way to keep tabs on pop-ups, tastings, and seasonal moments.",
    },
  ],
};

export const DEFAULT_CART_SERVICE_PAGE_MARKETING_CONTENT: CartServicePageMarketingContent = {
  eyebrow: "The Cart Service",
  title:
    "A mobile snack and beverage cart designed to feel like both the service and the scene.",
  description:
    "The cart is made for showers, school events, birthdays, open houses, launch events, markets, and corporate socials where the service should feel polished and memorable.",
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
