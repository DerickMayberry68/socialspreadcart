"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { DEFAULT_SITE_CONFIGURATION, navigation } from "@/lib/site";
import type { ShellNavigationItem } from "@/lib/types/site-content";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  navigation?: ShellNavigationItem[];
  headerTopLeft?: string;
  headerTopRight?: string;
  bookingCtaLabel?: string;
  bookingCtaTarget?: string;
};

export function SiteHeader({
  navigation: navItems = navigation,
  headerTopLeft = "Bentonville - Pickup, delivery, and styled cart service",
  headerTopRight = "Host-friendly favorites with playful polish",
  bookingCtaLabel = DEFAULT_SITE_CONFIGURATION.booking_cta_label,
  bookingCtaTarget = DEFAULT_SITE_CONFIGURATION.booking_cta_target,
}: SiteHeaderProps = {}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-walnut/15 bg-[#fefaf0]/35 backdrop-blur-xl">
      <div className="border-b border-sage/10 bg-white/55">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-ink/55 sm:px-6 lg:px-8">
          <span>{headerTopLeft}</span>
          <span className="hidden sm:block">{headerTopRight}</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-32 sm:w-36">
          <Logo priority />
        </div>
        <nav className="hidden items-center gap-2 rounded-full border border-sage/10 bg-white/70 px-3 py-2 shadow-soft lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm uppercase tracking-[0.16em] text-ink/72 transition hover:bg-[#eef4e9] hover:text-sage",
                pathname === item.href && "bg-[#eef4e9] text-sage",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button asChild>
            <Link href={bookingCtaTarget}>{bookingCtaLabel}</Link>
          </Button>
        </div>
        <button
          type="button"
          className="rounded-full border border-sage/20 bg-white/70 p-2 text-sage lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="border-t border-sage/10 bg-white/92 px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-3 py-2 text-sm uppercase tracking-[0.18em] text-ink/80",
                  pathname === item.href && "bg-[#eef4e9] text-sage",
                )}
              >
                {item.title}
              </Link>
            ))}
            <Button asChild>
              <Link href={bookingCtaTarget} onClick={() => setOpen(false)}>
                {bookingCtaLabel}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
