import type {
  EventItem,
  GalleryItem,
  MenuItem,
  Testimonial,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

const template = (name: string) => `/brand/templates/${name}`;

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
    image_url: template("template-10.svg"),
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
    image_url: template("template-8.svg"),
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
    image_url: template("template-9.svg"),
    featured: true,
    order_url: "#quote-form",
  },
  {
    id: "petite-grazing-cups",
    name: "Petite Grazing Cups",
    slug: slugify("Petite Grazing Cups"),
    description:
      "Individually styled grazing cups for cocktail hours, pop-ups, and polished grab-and-go service.",
    price_cents: 7200,
    size: "Mini",
    dietary: ["Vegetarian Option"],
    occasion: ["Corporate", "Pop-up", "Reception"],
    lead_time: "72 hours",
    image_url: template("template-6.svg"),
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
    image_url: template("template-2.svg"),
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
    image_url: template("template-7.svg"),
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
      "Stop by for signature grazing cups, take-home boards, and seasonal specials from the cart.",
    image_url: template("template-8.svg"),
    join_url: "#quote-form",
  },
  {
    id: "argenta-evening-market",
    title: "Argenta Evening Market",
    date: "2026-05-02T18:00:00-05:00",
    location: "8th Street Market, Bentonville",
    description:
      "An evening cart service featuring sharable bites, sparkling pairings, and Mother's Day gifting inspiration.",
    image_url: template("template-6.svg"),
    join_url: "#quote-form",
  },
  {
    id: "bridal-showcase",
    title: "Bridal Showcase Tasting",
    date: "2026-05-23T13:00:00-05:00",
    location: "Downtown Bentonville Event Loft",
    description:
      "A curated tasting experience for couples exploring mobile charcuterie service for wedding weekends.",
    image_url: template("template-10.svg"),
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
    image_url: template("template-10.svg"),
  },
  {
    id: "gallery-2",
    title: "Luxe stationary-inspired layouts",
    eyebrow: "Instagram Templates",
    image_url: template("template-9.svg"),
  },
  {
    id: "gallery-3",
    title: "Vintage-modern story frames",
    eyebrow: "Editorial Moments",
    image_url: template("template-8.svg"),
  },
  {
    id: "gallery-4",
    title: "Clean green-and-cream presentation",
    eyebrow: "Brand Style",
    image_url: template("template-7.svg"),
  },
  {
    id: "gallery-5",
    title: "Premium seasonal feature art",
    eyebrow: "Social Assets",
    image_url: template("template-6.svg"),
  },
  {
    id: "gallery-6",
    title: "Refined event announcement artwork",
    eyebrow: "Launch Materials",
    image_url: template("template-2.svg"),
  },
];

export const cartHighlights = [
  "Mobile charcuterie cart service for weddings, showers, launch parties, and corporate receptions",
  "Full grazing tables, passed appetizers, and custom styled spreads",
  "Pickup, local delivery, and on-site setup across Bentonville and surrounding areas",
  "Seasonal menus, dietary accommodations, and fully branded presentation details",
];

export const faqItems = [
  {
    question: "How far in advance should I book?",
    answer:
      "Boards typically require 48 to 72 hours, while cart service and larger spreads are best booked 2 to 4 weeks in advance.",
  },
  {
    question: "Do you offer delivery?",
    answer:
      "Yes. Local pickup and delivery are available for boards, and on-site service is available for Bentonville and nearby communities.",
  },
  {
    question: "Can you accommodate dietary requests?",
    answer:
      "Yes. Gluten-free, vegetarian, and custom menu adjustments can be made with advance notice.",
  },
];
