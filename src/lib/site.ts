import type { Metadata } from "next";

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
