import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Inbox,
  TrendingUp,
  Users,
} from "lucide-react";

import { Greeting } from "./greeting";
import { getSupabaseUser } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import { ContactService } from "@/services/contact-service";
import { EventService } from "@/services/event-service";
import { getRecentQuotes } from "@/services/quote-service";

export const metadata: Metadata = { title: "Dashboard | Admin" };

async function getDashboardData() {
  const tenant = await getCurrentTenant();

  const [quotes, contacts, events] = await Promise.all([
    getRecentQuotes(tenant.id, 6),
    ContactService.getRecentContacts(tenant.id, 6),
    EventService.listUpcomingEvents(tenant.id),
  ]);

  const newQuotes = quotes.filter((q) => q.status === "new").length;
  const newContacts = contacts.filter((c) => c.status === "new").length;

  return { tenant, quotes, contacts, events, newQuotes, newContacts };
}

const quoteStatusStyles: Record<string, string> = {
  new: "bg-[#f5e7d4] text-[#9a6c44]",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-[#eef4e9] text-[#4f684d]",
  closed: "bg-ink/10 text-ink/50",
  lost: "bg-red-50 text-red-600",
};

const contactStatusStyles: Record<string, string> = {
  new: "bg-[#f5e7d4] text-[#9a6c44]",
  contacted: "bg-blue-50 text-blue-700",
  booked: "bg-[#eef4e9] text-[#4f684d]",
  closed: "bg-ink/10 text-ink/50",
};

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] ?? "bg-ink/10 text-ink/50"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [user, data] = await Promise.all([getSupabaseUser(), getDashboardData()]);

  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-8 py-8 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.18)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#d7e2d4]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.96]">
            <Greeting name={name} />.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#eef2ed]/82">
            Here&apos;s what&apos;s happening at {data.tenant.name} today &mdash; fresh inquiries, upcoming events, and anything that might need a quick follow-up.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] border border-[#e4dbc9] bg-[#fffaf4] px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Attention needed</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">{data.newQuotes + data.newContacts}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              New items across quotes and contacts waiting for follow-up.
            </p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Upcoming activity</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">{data.events.length}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Public events currently scheduled in the calendar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "New Quotes",
            value: data.newQuotes,
            icon: FileText,
            href: "/admin/quotes?status=new",
            accent: "bg-[#f5e7d4] text-[#9a6c44]",
          },
          {
            label: "New Contacts",
            value: data.newContacts,
            icon: Users,
            href: "/admin/contacts?status=new",
            accent: "bg-[#eef4e9] text-[#4f684d]",
          },
          {
            label: "Total Contacts",
            value: data.contacts.length,
            icon: Inbox,
            href: "/admin/contacts",
            accent: "bg-[#eef4e9] text-[#4f684d]",
          },
          {
            label: "Upcoming Events",
            value: data.events.length,
            icon: CalendarDays,
            href: "/admin/events",
            accent: "bg-[#f8ddd1] text-[#a15e50]",
          },
        ].map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-[24px] border border-sage/10 bg-white px-5 py-5 shadow-soft transition hover:-translate-y-0.5 hover:border-sage/20"
          >
            <div className={`rounded-[16px] p-3 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-ink/50">{label}</p>
              <p className="mt-0.5 font-heading text-3xl text-ink">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
            <div>
              <h2 className="font-heading text-3xl text-[#284237]">Recent Quotes</h2>
              <p className="mt-1 text-sm text-ink/50">Fresh inquiries and current deal flow</p>
            </div>
            <Link href="/admin/quotes" className="text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage">
              View all
            </Link>
          </div>

          {data.quotes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-ink/40">No quotes yet.</p>
          ) : (
            <ul className="divide-y divide-sage/8">
              {data.quotes.slice(0, 5).map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-sage/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{quote.name}</p>
                      <p className="truncate text-xs text-ink/50">{quote.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={quote.status} styles={quoteStatusStyles} />
                      <span className="text-xs text-ink/40">
                        {new Date(quote.event_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
            <div>
              <h2 className="font-heading text-3xl text-[#284237]">Recent Contacts</h2>
              <p className="mt-1 text-sm text-ink/50">Leads, follow-ups, and relationship context</p>
            </div>
            <Link href="/admin/contacts" className="text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage">
              View all
            </Link>
          </div>

          {data.contacts.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-ink/40">No contacts yet.</p>
          ) : (
            <ul className="divide-y divide-sage/8">
              {data.contacts.slice(0, 5).map((contact) => (
                <li key={contact.id}>
                  <Link
                    href={`/admin/contacts/${contact.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-sage/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{contact.name}</p>
                      <p className="truncate text-xs text-ink/50">{contact.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={contact.status} styles={contactStatusStyles} />
                      <span className="text-xs uppercase tracking-[0.1em] text-ink/35">
                        {contact.source === "quote" ? "Quote" : "Contact form"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {data.events.length > 0 && (
        <div className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
            <div>
              <h2 className="font-heading text-3xl text-[#284237]">Upcoming Events</h2>
              <p className="mt-1 text-sm text-ink/50">Public-facing activity on deck</p>
            </div>
            <Link href="/admin/events" className="text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage">
              Manage
            </Link>
          </div>
          <ul className="divide-y divide-sage/8">
            {data.events.map((event) => (
              <li key={event.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-[16px] bg-[#eef4e9] py-2 text-center">
                  <span className="text-xs uppercase tracking-wider text-[#4f684d]/75">
                    {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="font-heading text-2xl text-[#284237]">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                  <p className="truncate text-xs text-ink/50">{event.location}</p>
                </div>
                <div className="ml-auto rounded-full bg-[#f8ddd1] px-3 py-1 text-xs uppercase tracking-[0.15em] text-[#a15e50]">
                  Scheduled
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-sage/10 bg-[#fffaf4] px-6 py-5 shadow-soft">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#4f684d]" />
            <p className="text-sm leading-7 text-ink/66">
              The admin tone now matches the public site: calm surfaces, cleaner hierarchy, and clearer calls to action.
            </p>
          </div>
        </div>
        <div className="rounded-[24px] border border-sage/10 bg-white px-6 py-5 shadow-soft">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[#a15e50]" />
            <p className="text-sm leading-7 text-ink/66">
              Prioritize new quotes and new contacts first to keep response time feeling premium on the customer side.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
