import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, FileText, Users, Inbox } from "lucide-react";

import { getSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import type { Contact, Quote, EventItem } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard | Admin" };

async function getDashboardData() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const [quotesRes, contactsRes, eventsRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, name, email, event_date, services, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("contacts")
      .select("id, name, email, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("events")
      .select("id, title, date, location")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(5),
  ]);

  const quotes = (quotesRes.data ?? []) as Quote[];
  const contacts = (contactsRes.data ?? []) as Contact[];
  const events = (eventsRes.data ?? []) as EventItem[];

  const newQuotes = quotes.filter((q) => q.status === "new").length;
  const newContacts = contacts.filter((c) => c.status === "new").length;

  return { quotes, contacts, events, newQuotes, newContacts };
}

const quoteStatusStyles: Record<string, string> = {
  new: "bg-gold/15 text-gold",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-sage/15 text-sage",
  closed: "bg-ink/10 text-ink/50",
  lost: "bg-red-50 text-red-600",
};

const contactStatusStyles: Record<string, string> = {
  new: "bg-gold/15 text-gold",
  contacted: "bg-blue-50 text-blue-700",
  booked: "bg-sage/15 text-sage",
  closed: "bg-ink/10 text-ink/50",
};

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-ink/10 text-ink/50"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [user, data] = await Promise.all([getSupabaseUser(), getDashboardData()]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl text-sage">
          {greeting}, {name}.
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Here&rsquo;s what&rsquo;s happening with The Social Spread Cart.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "New Quotes",
            value: data?.newQuotes ?? 0,
            icon: FileText,
            href: "/admin/quotes?status=new",
            accent: "text-gold",
          },
          {
            label: "New Contacts",
            value: data?.newContacts ?? 0,
            icon: Users,
            href: "/admin/contacts?status=new",
            accent: "text-sage",
          },
          {
            label: "Total Contacts",
            value: data?.contacts.length ?? 0,
            icon: Inbox,
            href: "/admin/contacts",
            accent: "text-sage",
          },
          {
            label: "Upcoming Events",
            value: data?.events.length ?? 0,
            icon: CalendarDays,
            href: "/admin/events",
            accent: "text-gold",
          },
        ].map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-[20px] border border-sage/15 bg-white px-5 py-5 shadow-soft transition hover:border-sage/30"
          >
            <div className={`rounded-[14px] bg-sage/8 p-3 ${accent}`}>
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
        {/* Recent Quotes */}
        <div className="rounded-[20px] border border-sage/15 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-sage/10 px-6 py-4">
            <h2 className="font-heading text-2xl text-sage">Recent Quotes</h2>
            <Link
              href="/admin/quotes"
              className="text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage"
            >
              View all
            </Link>
          </div>

          {!data || data.quotes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink/40">No quotes yet.</p>
          ) : (
            <ul className="divide-y divide-sage/8">
              {data.quotes.slice(0, 5).map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-sage/5"
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

        {/* Recent Contacts */}
        <div className="rounded-[20px] border border-sage/15 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-sage/10 px-6 py-4">
            <h2 className="font-heading text-2xl text-sage">Recent Contacts</h2>
            <Link
              href="/admin/contacts"
              className="text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage"
            >
              View all
            </Link>
          </div>

          {!data || data.contacts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink/40">No contacts yet.</p>
          ) : (
            <ul className="divide-y divide-sage/8">
              {data.contacts.slice(0, 5).map((contact) => (
                <li key={contact.id}>
                  <Link
                    href={`/admin/contacts/${contact.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-sage/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{contact.name}</p>
                      <p className="truncate text-xs text-ink/50">{contact.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={contact.status} styles={contactStatusStyles} />
                      <span className="text-xs uppercase tracking-[0.1em] text-ink/35">
                        {contact.source === "quote" ? "Quote" : "Contact Form"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      {data && data.events.length > 0 && (
        <div className="rounded-[20px] border border-sage/15 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-sage/10 px-6 py-4">
            <h2 className="font-heading text-2xl text-sage">Upcoming Events</h2>
            <Link
              href="/admin/events"
              className="text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage"
            >
              Manage
            </Link>
          </div>
          <ul className="divide-y divide-sage/8">
            {data.events.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-4 px-6 py-3.5"
              >
                <div className="flex w-12 shrink-0 flex-col items-center rounded-[12px] bg-sage/10 py-1.5 text-center">
                  <span className="text-xs uppercase tracking-wider text-sage/70">
                    {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="font-heading text-xl text-sage">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                  <p className="truncate text-xs text-ink/50">{event.location}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
