import type { Metadata } from "next";
import Link from "next/link";
import { Users, Inbox, PhoneCall, CheckCircle2 } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Contact, ContactStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Contacts | Admin" };

const statusStyles: Record<ContactStatus, string> = {
  new: "bg-gold/15 text-gold",
  contacted: "bg-blue-50 text-blue-700",
  booked: "bg-sage/15 text-sage",
  closed: "bg-ink/10 text-ink/50",
};

const statusIcons: Record<ContactStatus, React.ElementType> = {
  new: Inbox,
  contacted: PhoneCall,
  booked: CheckCircle2,
  closed: Users,
};

async function getContacts(search?: string, status?: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { contacts: [], counts: { new: 0, contacted: 0, booked: 0, closed: 0, total: 0 } };

  let query = supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

  const { data } = await query;
  const contacts = (data ?? []) as Contact[];

  const { data: allData } = await supabase.from("contacts").select("status");
  const all = (allData ?? []) as Pick<Contact, "status">[];
  const counts = {
    total: all.length,
    new: all.filter((c) => c.status === "new").length,
    contacted: all.filter((c) => c.status === "contacted").length,
    booked: all.filter((c) => c.status === "booked").length,
    closed: all.filter((c) => c.status === "closed").length,
  };

  return { contacts, counts };
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { contacts, counts } = await getContacts(params.search, params.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl text-sage">Contacts</h1>
          <p className="mt-1 text-sm text-ink/55">
            {counts.total} total &mdash; customers, leads, and inquiries
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["new", "contacted", "booked", "closed"] as ContactStatus[]).map((s) => {
          const Icon = statusIcons[s];
          return (
            <Link
              key={s}
              href={`/admin/contacts?status=${s}`}
              className={`flex items-center gap-3 rounded-[16px] border px-4 py-3.5 transition hover:shadow-soft ${
                params.status === s
                  ? "border-sage/30 bg-sage/10"
                  : "border-sage/15 bg-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-sage/60" />
              <div>
                <p className="text-xs uppercase tracking-[0.13em] text-ink/50 capitalize">{s}</p>
                <p className="font-heading text-2xl text-ink">{counts[s]}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search name, email, or phone…"
          className="flex-1 rounded-[14px] border border-sage/20 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
        />
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="rounded-[14px] border border-sage/20 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-sage"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="booked">Booked</option>
          <option value="closed">Closed</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-sage px-6 py-2.5 text-sm font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700"
        >
          Filter
        </button>
        {(params.search || params.status) && (
          <Link
            href="/admin/contacts"
            className="rounded-full border border-sage/20 px-6 py-2.5 text-center text-sm uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40"
          >
            Clear
          </Link>
        )}
      </form>

      {/* List */}
      <div className="rounded-[20px] border border-sage/15 bg-white shadow-soft">
        {contacts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-ink/20" />
            <p className="mt-4 text-sm text-ink/40">No contacts found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-sage/8">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/admin/contacts/${contact.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-sage/5"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 font-heading text-lg text-sage">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{contact.name}</p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink/50">
                      <span>{contact.email}</span>
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[contact.status]}`}
                    >
                      {contact.status}
                    </span>
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
  );
}
