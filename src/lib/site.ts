import type { Metadata } from "next";

import type { ServiceOption } from "@/types/booking";
import type {
  HeroContent,
  PathwayCard,
  SiteConfiguration,
} from "@/lib/types/site-content";

export const siteConfig = {
  name: "The Social Spread Cart",
  domain: "TheSocialSpreadCart.com",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thesocialspreadcart.com",
  description:
    "A Bentonville mobile cart offering charcuterie boxes, charcuterie cups, dirty soda, a mini pancake bar, bartending service, and an ice cream toppings bar for NWA events.",
  phone: "(870) 654-3732",
  email: "info@socialspreadcart.com",
  instagram: "https://instagram.com/thesocialspreadcart",
  location: "Bentonville, Arkansas",
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "The Social Spread Cart | Mobile Snack & Beverage Cart in NWA",
    template: "%s | The Social Spread Cart",
  },
  description: siteConfig.description,
  keywords: [
    "charcuterie Bentonville",
    "dirty soda Bentonville",
    "charcuterie cups Bentonville",
    "mini pancake bar Bentonville",
    "bartending service Bentonville",
    "ice cream toppings bar Bentonville",
    "mobile snack cart Arkansas",
    "mobile beverage cart Arkansas",
    "NWA snack cart",
  ],
  openGraph: {
    title: "The Social Spread Cart",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/brand/logos/logo-rect.png",
        width: 940,
        height: 788,
        alt: "The Social Spread Cart logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Social Spread Cart",
    description: siteConfig.description,
    images: ["/brand/logos/logo-rect.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export const navigation = [
  { title: "Home", href: "/" },
  { title: "Menu", href: "/menu" },
  { title: "The Cart", href: "/cart-service" },
  { title: "Events", href: "/events" },
  { title: "Gallery", href: "/gallery" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

export const serviceOptions = [
  "Charcuterie Boxes",
  "Charcuterie Cups",
  "Dirty Soda 4-Pack",
  "Charcuterie Cart",
  "Dirty Soda Cart",
  "Mini Pancake Bar",
  "Bartending Service",
  "Ice Cream Toppings Bar",
  "Other",
];

/**
 * DEFAULT_* constants — last-resort fallbacks used by the
 * site-content service when the database is unreachable and
 * no tenant-scoped row can be loaded. Tenant-specific defaults
 * are seeded into the database itself (see migration
 * 20260421_site_content.sql) so these are only for catastrophic
 * outages. Keep them generic and professional.
 */

export const DEFAULT_SITE_CONFIGURATION: Omit<
  SiteConfiguration,
  "tenant_id" | "updated_at" | "updated_by"
> = {
  brand_name: "The Social Spread Cart",
  brand_tagline: "Mobile snacks & sips for unforgettable events",
  booking_cta_label: "Book the Cart",
  booking_cta_target: "/contact",
  support_phone: null,
  support_email: null,
};

export const DEFAULT_HERO_CONTENT: Omit<
  HeroContent,
  "tenant_id" | "updated_at" | "updated_by"
> = {
  headline: "Snacks, sips, and cart service for Northwest Arkansas events.",
  sub_line: "Snacks & sips, served your way.",
  body:
    "The Social Spread Cart brings charcuterie, dirty soda, mini pancakes, bartending, and ice cream toppings to pickups, parties, and local events.",
  primary_cta_label: "Start Your Order",
  primary_cta_target: "/contact",
  secondary_cta_label: "Browse the Menu",
  secondary_cta_target: "/menu",
};

export const DEFAULT_PATHWAY_CARDS: readonly [
  Omit<PathwayCard, "tenant_id" | "updated_at" | "updated_by">,
  Omit<PathwayCard, "tenant_id" | "updated_at" | "updated_by">,
  Omit<PathwayCard, "tenant_id" | "updated_at" | "updated_by">,
] = [
  {
    display_order: 1,
    title: "Pickup for gifting and easy hosting",
    body:
      "Order boxes, charcuterie cups, and bundles when you want something special without full-service catering.",
    badge: "Fastest path",
    link_target: "/menu",
    image_url: "/food/charcuterie-spread.jpg",
  },
  {
    display_order: 2,
    title: "Cart service that becomes part of the decor",
    body:
      "A styled setup for showers, weddings, community activations, school events, and private gatherings that deserve a focal point.",
    badge: "Event favorite",
    link_target: "/contact",
    image_url: "/client/cart-umbrella-wide.jpg",
  },
  {
    display_order: 3,
    title: "Pop-ups worth planning around",
    body:
      "Keep an eye on public events for signature sips, grab-and-go bites, and seasonal specials around Northwest Arkansas.",
    badge: "Community favorite",
    link_target: "/events",
    image_url: "/client/cart-dirty-soda-hero.jpg",
  },
] as const;

export const serviceDescriptions: Record<ServiceOption, string> = {
  "Charcuterie Boxes": "Hand-crafted individual grazing boxes for every guest",
  "Charcuterie Cups": "Portable cups perfect for mingling crowds",
  "Dirty Soda 4-Pack": "Four flavored craft sodas — a crowd favorite",
  "Charcuterie Cart": "Full cart setup with boards and displays",
  "Dirty Soda Cart": "Mobile dirty soda station served fresh to your guests",
  "Mini Pancake Bar": "Interactive pancake bar with toppings and syrups",
  "Bartending Service": "Professional bartending for your event",
  "Ice Cream Toppings Bar": "Build-your-own ice cream topping station",
  "Other": "Something unique in mind? Tell us more in your message",
};
