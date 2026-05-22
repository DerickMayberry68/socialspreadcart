import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const siteUrl = siteConfig.url.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/accept-invite",
          "/awaiting-invitation",
          "/choose-tenant",
          "/coming-soon",
          "/design-lab",
          "/login",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
