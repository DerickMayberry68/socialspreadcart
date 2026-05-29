import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Inbox,
  PhoneCall,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { AdminDataGrid, type AdminDataGridColumn } from "@/components/admin/admin-data-grid";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseAdminListQuery } from "@/lib/admin/list-query";
import type { ContactStatus } from "@/lib/types";
import { withCurrentTenant } from "@/lib/tenant";
import { ContactService, type ContactSort } from "@/services/contact-service";

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
  searchParams: Promise<{
    search?: string;
    status?: string;
    sort?: string;
    direction?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = parseAdminListQuery<ContactSort>({
    params,
    allowedSorts: ["name", "email", "source", "status", "created_at", "updated_at"],
    defaultSort: "created_at",
  });
  const [{ contacts: legacyContacts, counts }, contactsPage] = await Promise.all([
    getContacts(params.search, params.status),
    withCurrentTenant(ContactService.listContactsPage, query),
  ]);
  void legacyContacts;
  const activeStatus = params.status && params.status !== "all" ? params.status : null;
  const columns: Array<AdminDataGridColumn<ContactSort>> = [
    { key: "customer", label: "Customer", sortable: true, sortKey: "name" },
    { key: "email", label: "Email", sortable: true, sortKey: "email" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Source", sortable: true, sortKey: "source" },
    { key: "status", label: "Status", sortable: true, sortKey: "status" },
    { key: "added", label: "Added", sortable: true, sortKey: "created_at" },
    { key: "updated", label: "Updated", sortable: true, sortKey: "updated_at" },
  ];
  const listQuery = {
    search: query.search,
    status: query.status,
    sort: query.sort,
    direction: query.direction,
  };
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
            Manage your contacts and follow-ups.
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
              All contacts saved for your business.
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
              Search and filter contacts.
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
          <input type="hidden" name="sort" value={query.sort} />
          <input type="hidden" name="direction" value={query.direction} />
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
              {contactsPage.total} result{contactsPage.total === 1 ? "" : "s"} found
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d] sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Relationship-led view
          </div>
        </div>

        <AdminDataGrid<ContactSort>
          pathname="/admin/contacts"
          query={listQuery}
          sort={query.sort}
          direction={query.direction}
          columns={columns}
          minWidthClassName="min-w-[1080px]"
          rows={contactsPage.records.map((contact) => ({
            id: contact.id,
            href: `/admin/contacts/${contact.id}`,
            state: contact.status === "closed" ? "muted" : "active",
            cells: {
              customer: (
                <div className="min-w-0">
                  <p className="truncate font-medium">{contact.name}</p>
                </div>
              ),
              email: <span className="truncate">{contact.email}</span>,
              phone: contact.phone ? <span>{contact.phone}</span> : <span className="text-ink/35">No phone</span>,
              source: contact.source === "quote" ? "Quote lead" : "Contact form",
              status: (
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[contact.status]}`}
                >
                  {contact.status}
                </span>
              ),
              added: new Date(contact.created_at).toLocaleDateString(),
              updated: new Date(contact.updated_at).toLocaleDateString(),
            },
            actions: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/admin/contacts/${contact.id}`}
                    aria-label={`Open contact for ${contact.name}`}
                    className="rounded-full border border-sage/15 bg-white p-2.5 text-ink/50 transition hover:border-sage/30 hover:text-sage"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Open contact</TooltipContent>
              </Tooltip>
            ),
          }))}
          emptyState={
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-ink/20" />
              <p className="mt-4 font-heading text-2xl text-[#284237]">
                No contacts match that view.
              </p>
              <p className="mt-2 text-sm text-ink/45">
                Clear the filters or wait for the next inquiry to come through.
              </p>
            </div>
          }
        />
        <AdminPagination
          pathname="/admin/contacts"
          query={listQuery}
          page={contactsPage.page}
          pageCount={contactsPage.pageCount}
          pageSize={contactsPage.pageSize}
          total={contactsPage.total}
        />
      </section>
    </div>
  );
}
