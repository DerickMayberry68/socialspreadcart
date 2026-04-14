import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  LayoutDashboard,
  ShoppingBag,
  Shield,
  Users,
} from "lucide-react";

import { LogoutButton } from "@/components/admin/logout-button";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu-items", label: "Menu", icon: ShoppingBag },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/team", label: "Team", icon: Shield },
];

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbf5eb_0%,#f2e8d8_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-sage/10 bg-[#fffaf4] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-sage/10 px-6 py-5">
            <div className="w-10 shrink-0 overflow-hidden rounded-full border border-sage/10 bg-white p-1">
              <Image
                src="/brand/logos/logo-circle.png"
                alt="The Social Spread Cart"
                width={40}
                height={40}
                className="h-auto w-full"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-ink/45">Admin</p>
              <p className="font-heading text-2xl text-[#284237]">Social Spread Cart</p>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-5 py-5 text-[#f8f4ee] shadow-soft">
              <p className="text-xs uppercase tracking-[0.24em] text-[#d7e2d4]">
                Operations shell
              </p>
              <p className="mt-3 text-sm leading-7 text-[#eef2ed]/84">
                Keep quotes, contacts, events, and team access aligned in one calm workspace.
              </p>
            </div>
          </div>

          <nav className="space-y-2 px-4 pb-6">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm text-ink/72 transition hover:bg-[#eef4e9] hover:text-sage"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sage/10 px-4 py-4">
            <div className="space-y-2 rounded-[24px] bg-white px-3 py-3 shadow-soft">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:bg-[#eef4e9] hover:text-sage"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Back to Site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <div className="border-b border-sage/10 bg-white/50 px-6 py-4 backdrop-blur sm:px-8">
            <p className="text-xs uppercase tracking-[0.24em] text-ink/45">
              Calm admin, clear decisions, polished follow-through
            </p>
          </div>
          <main className="flex-1 p-6 sm:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
