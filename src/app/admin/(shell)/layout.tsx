import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, FileText, CalendarDays } from "lucide-react";

import { LogoutButton } from "@/components/admin/logout-button";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
];

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4ead6]">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-sage/15 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-sage/10 px-5 py-4">
          <div className="w-8 shrink-0">
            <Image
              src="/brand/logos/logo-circle.png"
              alt="The Social Spread Cart"
              width={32}
              height={32}
              className="h-auto w-full"
            />
          </div>
          <span className="font-heading text-lg leading-tight text-sage">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm text-ink/70 transition hover:bg-sage/10 hover:text-sage"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sage/10 px-3 py-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
