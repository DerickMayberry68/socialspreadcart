import type {
  EventItem,
  GalleryItem,
  MenuItem,
  Testimonial,
} from "@/lib/types";
import { foodMedia } from "@/lib/media";
import { slugify } from "@/lib/utils";

export const fallbackMenuItems: MenuItem[] = [
  {
    id: "classic-brunch-board",
    name: "Classic Brunch Board",
    slug: slugify("Classic Brunch Board"),
    description:
      "A balanced spread of artisan cheeses, fresh fruit, breakfast pastries, and seasonal jam for effortless hosting.",
    price_cents: 13500,
    size: "Small",
    dietary: ["Vegetarian"],
    occasion: ["Brunch", "Shower", "Corporate"],
    lead_time: "48 hours",
    image_url: foodMedia.miniPancakes,
    featured: true,
    order_url: "#quote-form",
  },
  {
    id: "southern-garden-board",
    name: "Southern Garden Board",
    slug: slugify("Southern Garden Board"),
    description:
      "Herbed cheeses, honeycomb, pickled vegetables, crackers, and floral garnish designed for elegant daytime gatherings.",
    price_cents: 18500,
    size: "Medium",
    dietary: ["Vegetarian", "Gluten-Free Option"],
    occasion: ["Birthday", "Engagement", "Girls Night"],
    lead_time: "72 hours",
    image_url: foodMedia.charcuteriePlatter,
    featured: true,
    order_url: "#quote-form",
  },
  {
    id: "celebration-spread",
    name: "Celebration Spread",
    slug: slugify("Celebration Spread"),
    description:
      "A statement board with cured meats, imported cheeses, gourmet bites, fruit, nuts, and luxe finishing details.",
    price_cents: 26500,
    size: "Large",
    dietary: ["Gluten-Free Option"],
    occasion: ["Wedding", "Corporate", "Holiday"],
    lead_time: "5 days",
    image_url: foodMedia.charcuterieSpread,
    featured: true,
    order_url: "#quote-form",
  },
  {
    id: "petite-grazing-cups",
    name: "Petite Grazing Cups",
    slug: slugify("Petite Grazing Cups"),
    description:
      "Individually styled snack cups for cocktail hours, pop-ups, and polished grab-and-go cart service.",
    price_cents: 7200,
    size: "Mini",
    dietary: ["Vegetarian Option"],
    occasion: ["Corporate", "Pop-up", "Reception"],
    lead_time: "72 hours",
    image_url: foodMedia.charcuteriePlatter,
    featured: false,
    order_url: "#quote-form",
  },
  {
    id: "veggie-harvest-board",
    name: "Veggie Harvest Board",
    slug: slugify("Veggie Harvest Board"),
    description:
      "A produce-forward board with dips, marinated vegetables, nuts, berries, and gluten-free accompaniments.",
    price_cents: 16000,
    size: "Medium",
    dietary: ["Vegetarian", "Gluten-Free"],
    occasion: ["Wellness", "Corporate", "Lunch"],
    lead_time: "72 hours",
    image_url: foodMedia.charcuterieSpread,
    featured: false,
    order_url: "#quote-form",
  },
  {
    id: "signature-sweets-board",
    name: "Signature Sweets Board",
    slug: slugify("Signature Sweets Board"),
    description:
      "A dessert-leaning board with macarons, chocolate, berries, and playful seasonal accents.",
    price_cents: 14500,
    size: "Medium",
    dietary: ["Vegetarian"],
    occasion: ["Birthday", "Baby Shower", "Holiday"],
    lead_time: "72 hours",
    image_url: foodMedia.dirtySodaFloat,
    featured: false,
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
      "Stop by for charcuterie cups, dirty soda, mini pancakes, and seasonal specials from the cart.",
    image_url: foodMedia.charcuteriePlatter,
    join_url: "#quote-form",
  },
  {
    id: "argenta-evening-market",
    title: "Argenta Evening Market",
    date: "2026-05-02T18:00:00-05:00",
    location: "8th Street Market, Bentonville",
    description:
      "An evening cart service featuring sharable bites, sparkling pairings, and Mother's Day gifting inspiration.",
    image_url: foodMedia.fruitSodaBottles,
    join_url: "#quote-form",
  },
  {
    id: "bridal-showcase",
    title: "Bridal Showcase Tasting",
    date: "2026-05-23T13:00:00-05:00",
    location: "Downtown Bentonville Event Loft",
    description:
      "A curated tasting experience for couples exploring snack, beverage, and grazing-cart service for wedding weekends.",
    image_url: foodMedia.dirtySodaFloat,
    join_url: "#quote-form",
  },
];

export const fallbackTestimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Madison R.",
    occasion: "Bridal Shower Host",
    quote:
      "Every detail felt polished and intentional. The cart became part of the decor and the food disappeared in minutes.",
  },
  {
    id: "testimonial-2",
    name: "Jordan T.",
    occasion: "Corporate Event Planner",
    quote:
      "Professional, beautiful, and easy to work with. The Social Spread Cart made our client event feel elevated without stress.",
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
    title: "Brand-forward event styling",
    eyebrow: "Curated Details",
    image_url: foodMedia.charcuterieSpread,
  },
  {
    id: "gallery-2",
    title: "Colorful drink moments from the cart",
    eyebrow: "Dirty Soda",
    image_url: foodMedia.dirtySodaFloat,
  },
  {
    id: "gallery-3",
    title: "Mini pancakes with a sweet brunch feel",
    eyebrow: "Mini Pancakes",
    image_url: foodMedia.miniPancakes,
  },
  {
    id: "gallery-4",
    title: "Bottle service and bright soda styling",
    eyebrow: "Beverage Cart",
    image_url: foodMedia.fruitSodaBottles,
  },
  {
    id: "gallery-5",
    title: "A close-up charcuterie moment for grazing service",
    eyebrow: "Charcuterie",
    image_url: foodMedia.charcuteriePlatter,
  },
  {
    id: "gallery-6",
    title: "Snack and drink pairings for pop-up service",
    eyebrow: "Cart Service",
    image_url: foodMedia.dirtySodaFloat,
  },
];

export const cartHighlights = [
  "Mobile snack and beverage cart service for weddings, showers, launch parties, school events, and corporate receptions",
  "Charcuterie, dirty soda, mini pancakes, sweet treats, and custom event-day menu mixes",
  "Pickup, local delivery, and on-site setup across Bentonville and surrounding areas",
  "Seasonal menu drops, dietary accommodations, and branded presentation details that feel polished in person and on camera",
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
