"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { navigation } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sage/10 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <div className="w-32 sm:w-36">
          <Logo priority />
        </div>
        <nav className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm uppercase tracking-[0.18em] text-ink/75 transition hover:text-sage",
                pathname === item.href && "text-sage",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button asChild>
            <Link href="/contact#quote-form">Book the Cart</Link>
          </Button>
        </div>
        <button
          type="button"
          className="rounded-full border border-sage/20 p-2 text-sage lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="border-t border-sage/10 bg-white/90 px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm uppercase tracking-[0.18em] text-ink/80",
                  pathname === item.href && "text-sage",
                )}
              >
                {item.title}
              </Link>
            ))}
            <Button asChild>
              <Link href="/contact#quote-form" onClick={() => setOpen(false)}>
                Book the Cart
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

