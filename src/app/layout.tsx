import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";

import { Analytics } from "@vercel/analytics/next";
import { defaultMetadata, siteConfig } from "@/lib/site";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    areaServed: "Bentonville, Arkansas",
    image: `${siteConfig.url}/brand/logos/logo-rect.png`,
    description: siteConfig.description,
  };

  return (
    <html lang="en" className={`${heading.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        <Analytics />
        <Toaster richColors position="top-right" />
        <Script
          id="local-business-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </body>
    </html>
  );
}
