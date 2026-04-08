import type {
  EventItem,
  GalleryItem,
  MenuItem,
  Testimonial,
} from "@/lib/types";
import { clientMedia, foodMedia } from "@/lib/media";
import { slugify } from "@/lib/utils";

export const fallbackMenuItems: MenuItem[] = [
  {
    id: "large-charcuterie-box",
    name: "Large Charcuterie Box",
    slug: slugify("Large Charcuterie Box"),
    description:
      "Our largest charcuterie box, styled for gifting, hosting, and easy pickup when you want a polished spread without full-service catering.",
    price_cents: 12000,
    size: "Large",
    dietary: ["Vegetarian Option", "Gluten-Free Option"],
    occasion: ["Shower", "Corporate", "Gift"],
    lead_time: "48 hours",
    image_url: foodMedia.charcuterieSpread,
    featured: true,
    order_url: "#quote-form",
  },
  {
    id: "charcuterie-cups",
    name: "Charcuterie Cups",
    slug: slugify("Charcuterie Cups"),
    description:
      "Individual charcuterie cups priced per guest and designed for cocktail hours, school events, pop-ups, and grab-and-go hosting.",
    price_cents: 800,
    size: "Single",
    dietary: ["Vegetarian Option"],
    occasion: ["Corporate", "Reception", "Pop-up"],
    lead_time: "48 hours",
    image_url: clientMedia.charcuterieCupDetail,
    featured: true,
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
      "An evening service built around charcuterie, dirty soda, and polished grab-and-go options for shoppers and guests.",
    image_url: clientMedia.cartDirtySodaHero,
    join_url: "#quote-form",
  },
  {
    id: "bridal-showcase",
    title: "Bridal Showcase Tasting",
    date: "2026-05-23T13:00:00-05:00",
    location: "Downtown Bentonville Event Loft",
    description:
      "A tasting experience for couples exploring charcuterie, bartending, and specialty cart service for wedding weekends.",
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
    title: "Dirty soda service from the cart",
    eyebrow: "Cart Service",
    image_url: clientMedia.cartDirtySodaHero,
  },
  {
    id: "gallery-2",
    title: "A mini pancake bar styled for brunches, showers, and event-day service",
    eyebrow: "Mini Pancake Bar",
    image_url: clientMedia.miniPancakeBar,
  },
  {
    id: "gallery-3",
    title: "Grab-and-go charcuterie cups for pop-ups and parties",
    eyebrow: "Charcuterie Cups",
    image_url: clientMedia.charcuterieCupCloseup,
  },
  {
    id: "gallery-4",
    title: "The cart setup ready for a real event day",
    eyebrow: "Event Setup",
    image_url: clientMedia.cartUmbrellaWide,
  },
  {
    id: "gallery-5",
    title: "Snack box styling paired with a bright drink",
    eyebrow: "Snack + Sip",
    image_url: clientMedia.dirtySodaAndCharcuterieBox,
  },
  {
    id: "gallery-6",
    title: "A close-up charcuterie moment for grazing service",
    eyebrow: "Charcuterie",
    image_url: clientMedia.charcuterieCupDetail,
  },
];

export const cartHighlights = [
  "Mobile cart service for weddings, showers, school events, launch parties, and corporate receptions across Bentonville and nearby communities",
  "Pickup menu currently includes large charcuterie boxes, charcuterie cups, and dirty soda 4-packs to go",
  "Cart service offerings include charcuterie, dirty soda, a mini pancake bar, bartending service, and an ice cream toppings bar",
  "Presentation is styled to feel polished on-site and easy for guests to enjoy throughout the event",
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
