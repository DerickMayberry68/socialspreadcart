import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Filter,
  Inbox,
  PhoneCall,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import type { ContactStatus } from "@/lib/types";
import { withCurrentTenant } from "@/lib/tenant";
import { ContactService } from "@/services/contact-service";

export const metadata: Metadata = { title: "Contacts | Admin" };

const statusStyles: Record<ContactStatus, string> = {
  new: "bg-[#f5e7d4] text-[#9a6c44]",
  contacted: "bg-blue-50 text-blue-700",
  booked: "bg-[#eef4e9] text-[#4f684d]",
  closed: "bg-ink/10 text-ink/50",
};

const statusIcons: Record<ContactStatus, React.ElementType> = {
  new: Inbox,
  contacted: PhoneCall,
  booked: CheckCircle2,
  closed: Users,
};

async function getContacts(search?: string, status?: string) {
  const [contacts, counts] = await Promise.all([
    withCurrentTenant(ContactService.listContacts, search, status),
    withCurrentTenant(ContactService.getContactStatusCounts),
  ]);

  return { contacts, counts };
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { contacts, counts } = await getContacts(params.search, params.status);
  const activeStatus = params.status && params.status !== "all" ? params.status : null;
  const statusCards = [
    {
      key: "new" as const,
      label: "New",
      href: "/admin/contacts?status=new",
      note: "Fresh leads to review",
      accent: "bg-[#f5e7d4] text-[#9a6c44]",
    },
    {
      key: "contacted" as const,
      label: "Contacted",
      href: "/admin/contacts?status=contacted",
      note: "Active follow-up stage",
      accent: "bg-blue-50 text-blue-700",
    },
    {
      key: "booked" as const,
      label: "Booked",
      href: "/admin/contacts?status=booked",
      note: "Converted relationships",
      accent: "bg-[#eef4e9] text-[#4f684d]",
    },
    {
      key: "closed" as const,
      label: "Closed",
      href: "/admin/contacts?status=closed",
      note: "Finished contact cycle",
      accent: "bg-ink/10 text-ink/55",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-[#e4dbc9] bg-[#fffaf4] px-7 py-7 shadow-soft">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">Contacts</p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.95] text-[#284237]">
            Every lead deserves context, care, and a next step.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/64">
            Track inquiries beyond the first form fill. Keep contact history visible, stay
            responsive, and preserve the warm, premium experience customers feel on the site.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-6 py-6 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[#d7e2d4]">Total contacts</p>
            <p className="mt-3 font-heading text-4xl">{counts.total}</p>
            <p className="mt-2 text-sm leading-7 text-[#eef2ed]/82">
              The active relationship book for this tenant.
            </p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Open follow-up</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">
              {counts.new + counts.contacted}
            </p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Contacts still waiting on outreach or resolution.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map(({ key, label, href, note, accent }) => {
          const Icon = statusIcons[key];
          const isActive = activeStatus === key;

          return (
            <Link
              key={key}
              href={href}
              className={`rounded-[24px] border px-5 py-5 shadow-soft transition hover:-translate-y-0.5 ${
                isActive
                  ? "border-[#d9c7af] bg-[#fffaf4]"
                  : "border-sage/10 bg-white hover:border-sage/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-[16px] p-3 ${accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink/38">
                  {isActive ? "Filtered" : "View"}
                </p>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/50">{label}</p>
              <p className="mt-1 font-heading text-3xl text-ink">{counts[key]}</p>
              <p className="mt-2 text-sm leading-6 text-ink/58">{note}</p>
            </Link>
          );
        })}
      </div>

      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
              Filter your relationship view
            </p>
            <h2 className="mt-3 font-heading text-3xl text-[#284237]">
              Find the right person and the right moment fast.
            </h2>
          </div>
          {(params.search || activeStatus) && (
            <Link
              href="/admin/contacts"
              className="inline-flex w-fit items-center rounded-full border border-sage/20 px-5 py-2 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40 hover:text-sage"
            >
              Reset filters
            </Link>
          )}
        </div>

        <form method="GET" className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Search name, email, or phone..."
                className="w-full rounded-[16px] border border-sage/15 bg-[#fffaf4] py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-sage focus:bg-white focus:ring-1 focus:ring-sage"
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Status</span>
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="w-full rounded-[16px] border border-sage/15 bg-[#fffaf4] px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:bg-white"
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="booked">Booked</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-sage px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-cream transition hover:bg-sage-700 lg:self-end"
          >
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
          <div>
            <h2 className="font-heading text-3xl text-[#284237]">Contact list</h2>
            <p className="mt-1 text-sm text-ink/50">
              {contacts.length} result{contacts.length === 1 ? "" : "s"} shown
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d] sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Relationship-led view
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-ink/20" />
            <p className="mt-4 font-heading text-2xl text-[#284237]">
              No contacts match that view.
            </p>
            <p className="mt-2 text-sm text-ink/45">
              Clear the filters or wait for the next inquiry to come through.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sage/8">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/admin/contacts/${contact.id}`}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-[#fcf8f1] sm:flex-row sm:items-center"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4e9] font-heading text-xl text-[#284237]">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{contact.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/50">
                      <span>{contact.email}</span>
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[contact.status]}`}
                    >
                      {contact.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.1em] text-ink/35">
                      <Filter className="h-3 w-3" />
                      {contact.source === "quote" ? "Quote lead" : "Contact form"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
