import Link from "next/link";
import { AtSign, Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { navigation, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-sage/10 bg-[#f5edda]">
      <div className="absolute inset-x-0 top-0 h-6 bg-stripe opacity-90" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="w-40">
            <Logo />
          </div>
          <p className="mt-6 max-w-md text-base leading-7 text-ink/70">
            A mobile snack and beverage cart serving Bentonville and the wider
            NWA area with charcuterie boxes, charcuterie cups, dirty soda, mini
            pancake bar service, and polished event setups.
          </p>
        </div>
        <div>
          <h3 className="font-heading text-2xl text-sage">Explore</h3>
          <ul className="mt-4 space-y-3 text-sm uppercase tracking-[0.18em] text-ink/70">
            {navigation.map((item) => (
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
              {siteConfig.location}
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-sage" />
              {siteConfig.phone}
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-sage" />
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            </li>
            <li className="flex items-center gap-3">
              <AtSign className="h-4 w-4 text-sage" />
              <a href={siteConfig.instagram} target="_blank" rel="noreferrer">
                @thesocialspreadcart
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sage/10 px-4 py-5 text-center text-xs uppercase tracking-[0.18em] text-ink/55">
        &copy; {new Date().getFullYear()} The Social Spread Cart &mdash; Created with ❤️ by{" "}
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
