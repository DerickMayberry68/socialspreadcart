import Link from "next/link";
import { AtSign, Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { DEFAULT_SITE_CONFIGURATION, navigation, siteConfig } from "@/lib/site";
import type { ShellNavigationItem } from "@/lib/types/site-content";

type SiteFooterProps = {
  navigation?: ShellNavigationItem[];
  bookingCtaLabel?: string;
  bookingCtaTarget?: string;
  ctaEyebrow?: string;
  ctaTitle?: string;
  description?: string;
  location?: string;
  phone?: string;
  email?: string;
  instagramLabel?: string;
  instagramUrl?: string;
};

export function SiteFooter({
  navigation: navItems = navigation,
  bookingCtaLabel = DEFAULT_SITE_CONFIGURATION.booking_cta_label,
  bookingCtaTarget = DEFAULT_SITE_CONFIGURATION.booking_cta_target,
  ctaEyebrow = "Let's make hosting feel lovely",
  ctaTitle = "Warm hospitality, joyful details, and a setup guests remember.",
  description = "A mobile snack and beverage cart serving Bentonville and the wider NWA area with charcuterie boxes, charcuterie cups, dirty soda, mini pancake bar service, and polished event setups.",
  location = siteConfig.location,
  phone = siteConfig.phone,
  email = siteConfig.email,
  instagramLabel = "@thesocialspreadcart",
  instagramUrl = siteConfig.instagram,
}: SiteFooterProps = {}) {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-walnut/20 bg-[#f3e4c3]">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-[linear-gradient(135deg,#3c2514_0%,#6b3f22_100%)] px-8 py-10 text-[#fbf0d6] shadow-[0_26px_80px_rgba(60,37,20,0.28)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#efdfb7]">
                {ctaEyebrow}
              </p>
              <h2 className="mt-4 font-heading text-4xl leading-tight sm:text-5xl">
                {ctaTitle}
              </h2>
            </div>
            <Link
              href={bookingCtaTarget}
              className="inline-flex items-center justify-center rounded-full bg-[#efdfb7] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[#3c2514] transition hover:-translate-y-0.5 hover:bg-[#e5cf98]"
            >
              {bookingCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="w-40">
            <Logo />
          </div>
          <p className="mt-6 max-w-md text-base leading-7 text-ink/70">
            {description}
          </p>
        </div>
        <div>
          <h3 className="font-heading text-2xl text-sage">Explore</h3>
          <ul className="mt-4 space-y-3 text-sm uppercase tracking-[0.18em] text-ink/70">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-sage">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-2xl text-sage">Contact</h3>
          <ul className="mt-4 space-y-4 text-sm text-ink/70">
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-sage" />
              {location}
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-sage" />
              {phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-sage" />
              <a href={`mailto:${email}`}>{email}</a>
            </li>
            <li className="flex items-center gap-3">
              <AtSign className="h-4 w-4 text-sage" />
              <a href={instagramUrl} target="_blank" rel="noreferrer">
                {instagramLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sage/10 px-4 py-5 text-center text-xs uppercase tracking-[0.18em] text-ink/55">
        &copy; {new Date().getFullYear()} The Social Spread Cart - Created with care by{" "}
        <a
          href="https://studioxconsulting.com"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-sage"
        >
          Studio X Consulting LLC
        </a>
      </div>
    </footer>
  );
}
