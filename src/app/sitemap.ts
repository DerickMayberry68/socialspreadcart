import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const siteUrl = siteConfig.url.replace(/\/$/, "");

const publicRoutes = [
  { href: "/", changeFrequency: "weekly", priority: 1 },
  { href: "/menu", changeFrequency: "weekly", priority: 0.9 },
  { href: "/cart-service", changeFrequency: "monthly", priority: 0.85 },
  { href: "/events", changeFrequency: "weekly", priority: 0.85 },
  { href: "/gallery", changeFrequency: "monthly", priority: 0.75 },
  { href: "/about", changeFrequency: "monthly", priority: 0.7 },
  { href: "/contact", changeFrequency: "monthly", priority: 0.8 },
] as const satisfies ReadonlyArray<{
  href: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

const lastModified = new Date("2026-05-22");

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.href}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
