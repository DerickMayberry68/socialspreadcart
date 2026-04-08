import type { Metadata } from "next";

export const siteConfig = {
  name: "The Social Spread Cart",
  domain: "TheSocialSpreadCart.com",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thesocialspreadcart.com",
  description:
    "Luxury charcuterie boards, a mobile catering cart, and elevated event spreads in Bentonville, Arkansas.",
  phone: "(501) 555-0191",
  email: "info@socialspreadcart.com",
  instagram: "https://instagram.com/thesocialspreadcart",
  location: "Bentonville, Arkansas",
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "The Social Spread Cart | Charcuterie Boards & Mobile Catering in Bentonville",
    template: "%s | The Social Spread Cart",
  },
  description: siteConfig.description,
  keywords: [
    "charcuterie Bentonville",
    "mobile catering Arkansas",
    "grazing tables Bentonville",
    "event catering Arkansas",
    "charcuterie boards Arkansas",
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
  { title: "Boards", href: "/menu" },
  { title: "The Cart", href: "/cart-service" },
  { title: "Events", href: "/events" },
  { title: "Gallery", href: "/gallery" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

export const serviceOptions = [
  "Boards",
  "Mobile Cart",
  "Custom Catering",
  "Pop-up",
  "Other",
];
