import type {
  EventItem,
  GalleryItem,
  MenuItem,
  Testimonial,
} from "@/lib/types";
import { cartGallery, clientMedia, foodMedia } from "@/lib/media";
import { slugify } from "@/lib/utils";

export const fallbackMenuItems: MenuItem[] = [
  {
    id: "large-charcuterie-box",
    name: "Large Charcuterie Box",
    slug: slugify("Large Charcuterie Box"),
    description:
      "Our largest charcuterie box for gifting, hosting, and easy pickup when you want a generous spread without full-service catering.",
    price_cents: 12000,
    size: "Large",
    dietary: ["Vegetarian Option", "Gluten-Free Option"],
    occasion: ["Shower", "Corporate", "Gift"],
    lead_time: "48 hours",
    image_url: foodMedia.charcuterieBox,
    featured: true,
    is_active: true,
    order_url: "#quote-form",
  },
  {
    id: "charcuterie-cups",
    name: "Charcuterie Cups",
    slug: slugify("Charcuterie Cups"),
    description:
      "Individual charcuterie cups priced per guest for cocktail hours, school events, pop-ups, and grab-and-go hosting.",
    price_cents: 800,
    size: "Single",
    dietary: ["Vegetarian Option"],
    occasion: ["Corporate", "Reception", "Pop-up"],
    lead_time: "48 hours",
    image_url: clientMedia.charcuterieCupDetail,
    featured: true,
    is_active: true,
    order_url: "#quote-form",
  },
  {
    id: "dirty-soda-4-pack",
    name: "Dirty Soda 4-Pack To-Go",
    slug: slugify("Dirty Soda 4-Pack To-Go"),
    description:
      "A take-home four pack of signature dirty sodas, ready for gifting, event add-ons, or stocking the fridge before a gathering.",
    price_cents: 2500,
    size: "4-Pack",
    dietary: ["Custom Flavors"],
    occasion: ["Party", "Gift", "Pickup"],
    lead_time: "24 hours",
    image_url: clientMedia.dirtySodaAndCharcuterieBox,
    featured: true,
    is_active: true,
    order_url: "#quote-form",
  },
];

export const fallbackEvents: EventItem[] = [
  {
    id: "river-market-spring-pop-up",
    title: "River Market Spring Pop-up",
    date: "2026-04-18T11:00:00-05:00",
    location: "Downtown Bentonville Square, Bentonville",
    description:
      "Stop by for charcuterie cups, dirty soda, and rotating cart specials from the menu.",
    image_url: clientMedia.cartUmbrellaWide,
    join_url: "#quote-form",
  },
  {
    id: "argenta-evening-market",
    title: "Argenta Evening Market",
    date: "2026-05-02T18:00:00-05:00",
    location: "8th Street Market, Bentonville",
    description:
      "An evening service with charcuterie, dirty soda, and grab-and-go options for shoppers and guests.",
    image_url: clientMedia.cartDirtySodaHero,
    join_url: "#quote-form",
  },
  {
    id: "bridal-showcase",
    title: "Bridal Showcase Tasting",
    date: "2026-05-23T13:00:00-05:00",
    location: "Downtown Bentonville Event Loft",
    description:
      "A tasting for couples exploring charcuterie, bartending, and specialty cart service for wedding weekends.",
    image_url: clientMedia.dirtySodaAndCharcuterieBox,
    join_url: "#quote-form",
  },
];

export const fallbackTestimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Madison R.",
    occasion: "Bridal Shower Host",
    quote:
      "Everything was ready when guests arrived. The cart became part of the decor and the food disappeared in minutes.",
  },
  {
    id: "testimonial-2",
    name: "Jordan T.",
    occasion: "Corporate Event Planner",
    quote:
      "Professional, beautiful, and easy to work with. The Social Spread Cart made our client event feel special without stress.",
  },
  {
    id: "testimonial-3",
    name: "Alicia W.",
    occasion: "Birthday Celebration",
    quote:
      "The board styling was stunning and the flavors matched the presentation. Guests kept asking who created it.",
  },
];

export const fallbackGallery: GalleryItem[] = [
  {
    id: "gallery-1",
    title: "Dirty soda service from the cart",
    eyebrow: "Cart Service",
    image_url: clientMedia.cartDirtySodaHero,
    alt_text: "Dirty soda service from the cart",
    display_order: 1,
  },
  {
    id: "gallery-2",
    title: "A mini pancake bar styled for brunches, showers, and event-day service",
    eyebrow: "Mini Pancake Bar",
    image_url: clientMedia.miniPancakeBar,
    alt_text: "A mini pancake bar styled for brunches, showers, and event-day service",
    display_order: 2,
  },
  {
    id: "gallery-3",
    title: "Grab-and-go charcuterie cups for pop-ups and parties",
    eyebrow: "Charcuterie Cups",
    image_url: clientMedia.charcuterieCupCloseup,
    alt_text: "Grab-and-go charcuterie cups for pop-ups and parties",
    display_order: 3,
  },
  {
    id: "gallery-4",
    title: "The cart setup ready for a real event day",
    eyebrow: "Event Setup",
    image_url: clientMedia.cartUmbrellaWide,
    alt_text: "The cart setup ready for a real event day",
    display_order: 4,
  },
  {
    id: "gallery-5",
    title: "Snack box styling paired with a bright drink",
    eyebrow: "Snack + Sip",
    image_url: clientMedia.dirtySodaAndCharcuterieBox,
    alt_text: "Snack box styling paired with a bright drink",
    display_order: 5,
  },
  {
    id: "gallery-6",
    title: "A close-up charcuterie moment for grazing service",
    eyebrow: "Charcuterie",
    image_url: clientMedia.charcuterieCupDetail,
    alt_text: "A close-up charcuterie moment for grazing service",
    display_order: 6,
  },
];

export const fallbackGallerySection = {
  eyebrow: "Gallery",
  title:
    "A visual library of real cart service, drinks, grazing, and event-ready moments.",
  description:
    "Browse real cart service, drinks, grazing tables, and event setups from The Social Spread Cart.",
  feature_card_eyebrow: "What you will see",
  feature_card_title:
    "Real setups, colorful drinks, grazing details, and cart service moments.",
  support_card_body:
    "Use the gallery to picture pickup orders, cart service, and menu details for your own event.",
} as const;

export const fallbackAboutContent = {
  eyebrow: "About The Brand",
  title:
    "A Bentonville cart serving cheerful snacks, sips, and event-ready grazing.",
  description:
    "The Social Spread Cart exists for hosts who want the event to feel thoughtful and memorable without adding more stress to the planning process.",
  story_badge: "Bentonville based",
  story_title:
    "Charcuterie, dirty soda, and cart service for hosts across Northwest Arkansas.",
  story_body: [
    "The Social Spread Cart was created for hosts who want something more personal than standard catering. Menus and cart setups are planned to be approachable, generous, and easy for guests to enjoy.",
    "From take-home orders to full event setups, the current offer centers on large charcuterie boxes, charcuterie cups, dirty soda, and a small set of cart services including a mini pancake bar, bartending, and event-ready station setups.",
    "We serve Bentonville and nearby Northwest Arkansas communities with pickup items, local delivery, and on-site cart experiences.",
  ],
} as const;

export const fallbackAboutImages = cartGallery.map((image_url, index) => ({
  id: `about-image-${index + 1}`,
  display_order: index + 1,
  image_url,
  alt_text:
    [
      "The Social Spread Cart setup ready for an event day",
      "Dirty soda service from The Social Spread Cart",
      "Mini pancake bar styled for a brunch or shower",
      "Dirty soda and charcuterie box styling",
    ][index] ?? "The Social Spread Cart brand photography",
}));

export const fallbackAboutFeatureCards = [
  {
    display_order: 1,
    title: "Approachable service",
    body: "Clear planning and friendly service help hosts feel ready before guests arrive.",
    icon_key: "heart-handshake",
  },
  {
    display_order: 2,
    title: "Bright details",
    body: "Colorful drinks, generous boards, and cheerful service bring energy to the table.",
    icon_key: "sparkles",
  },
  {
    display_order: 3,
    title: "Locally rooted",
    body: "Built for Bentonville and the wider Northwest Arkansas event scene.",
    icon_key: "map-pin",
  },
] as const;

export const cartHighlights = [
  "Mobile cart service for weddings, showers, school events, launch parties, and corporate receptions across Bentonville and nearby communities",
  "Pickup menu currently includes large charcuterie boxes, charcuterie cups, and dirty soda 4-packs to go",
  "Cart service offerings include charcuterie, dirty soda, a mini pancake bar, bartending service, and an ice cream toppings bar",
  "Serving is arranged so guests can move through the cart or table easily throughout the event",
];

export const faqItems = [
  {
    question: "How far in advance should I book?",
    answer:
      "Smaller menu orders typically require 48 to 72 hours, while cart service and larger event bookings are best secured 2 to 4 weeks in advance.",
  },
  {
    question: "Do you offer delivery?",
    answer:
      "Yes. Pickup and local delivery are available for select menu items, and on-site cart service is available for Bentonville and nearby communities.",
  },
  {
    question: "Can you accommodate dietary requests?",
    answer:
      "Yes. Gluten-free, vegetarian, and custom menu adjustments can be made with advance notice.",
  },
];
