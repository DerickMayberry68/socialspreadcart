import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSearch,
  FileText,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import type { QuoteStatus } from "@/lib/types";
import { withCurrentTenant } from "@/lib/tenant";
import { getQuoteStatusCounts, listQuotes } from "@/services/quote-service";

export const metadata: Metadata = { title: "Quotes | Admin" };

const statusStyles: Record<QuoteStatus, string> = {
  new: "bg-[#f5e7d4] text-[#9a6c44]",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-[#eef4e9] text-[#4f684d]",
  closed: "bg-ink/10 text-ink/50",
  lost: "bg-red-50 text-red-600",
};

const statusIcons: Record<QuoteStatus, React.ElementType> = {
  new: FileText,
  in_progress: Clock,
  booked: CheckCircle2,
  closed: TrendingUp,
  lost: XCircle,
};

async function getQuotes(search?: string, status?: string) {
  const [quotes, counts] = await Promise.all([
    withCurrentTenant(listQuotes, search, status),
    withCurrentTenant(getQuoteStatusCounts),
  ]);

  return { quotes, counts };
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { quotes, counts } = await getQuotes(params.search, params.status);
  const activeStatus = params.status && params.status !== "all" ? params.status : null;
  const statusCards = [
    {
      key: "new" as const,
      label: "New",
      href: "/admin/quotes?status=new",
      note: "Fresh requests to review",
      accent: "bg-[#f5e7d4] text-[#9a6c44]",
    },
    {
      key: "in_progress" as const,
      label: "In Progress",
      href: "/admin/quotes?status=in_progress",
      note: "Active conversations",
      accent: "bg-blue-50 text-blue-700",
    },
    {
      key: "booked" as const,
      label: "Booked",
      href: "/admin/quotes?status=booked",
      note: "Confirmed events",
      accent: "bg-[#eef4e9] text-[#4f684d]",
    },
    {
      key: "closed" as const,
      label: "Closed",
      href: "/admin/quotes?status=closed",
      note: "Wrapped opportunities",
      accent: "bg-ink/10 text-ink/55",
    },
    {
      key: "lost" as const,
      label: "Lost",
      href: "/admin/quotes?status=lost",
      note: "Requests not moving forward",
      accent: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-7 py-7 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[#d7e2d4]">Quotes</p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.95]">
            Keep booking momentum calm, quick, and personal.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#eef2ed]/84">
            Review incoming requests, prioritize active conversations, and move customers
            from inquiry to confirmed event without losing context.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] border border-[#e4dbc9] bg-[#fffaf4] px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Total pipeline</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">{counts.total}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Quote records currently in your tenant pipeline.
            </p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Needs follow-up</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">
              {counts.new + counts.in_progress}
            </p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              New and active quote conversations worth checking first.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
              Filter the pipeline
            </p>
            <h2 className="mt-3 font-heading text-3xl text-[#284237]">
              Focus on the conversations that matter now.
            </h2>
          </div>
          {(params.search || activeStatus) && (
            <Link
              href="/admin/quotes"
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
              <FileSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Search name, email, or event type..."
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
              <option value="in_progress">In progress</option>
              <option value="booked">Booked</option>
              <option value="closed">Closed</option>
              <option value="lost">Lost</option>
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
            <h2 className="font-heading text-3xl text-[#284237]">Quote pipeline</h2>
            <p className="mt-1 text-sm text-ink/50">
              {quotes.length} result{quotes.length === 1 ? "" : "s"} shown
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#f5efe3] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#9a6c44] sm:flex">
            <CalendarDays className="h-3.5 w-3.5" />
            Event-first view
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-ink/20" />
            <p className="mt-4 font-heading text-2xl text-[#284237]">
              No quotes match that view.
            </p>
            <p className="mt-2 text-sm text-ink/45">
              Try broadening the filters or check back after the next inquiry comes in.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.2fr_180px_150px_120px_110px] gap-4 border-b border-sage/10 px-6 py-3 text-xs uppercase tracking-[0.13em] text-ink/40 md:grid">
              <span>Customer</span>
              <span>Event</span>
              <span>Date</span>
              <span>Guests</span>
              <span>Status</span>
            </div>
            <ul className="divide-y divide-sage/8">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="grid grid-cols-1 gap-3 px-6 py-5 transition hover:bg-[#fcf8f1] md:grid-cols-[1.2fr_180px_150px_120px_110px] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4e9] font-heading text-lg text-[#284237] sm:flex">
                          {quote.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{quote.name}</p>
                          <p className="truncate text-xs text-ink/50">{quote.email}</p>
                        </div>
                      </div>
                    </div>
                    <p className="truncate text-sm text-ink/70">{quote.event_type}</p>
                    <p className="text-sm text-ink/70">
                      {new Date(quote.event_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-ink/70">
                      <Users className="h-3.5 w-3.5 text-ink/35" />
                      {quote.guests}
                    </p>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[quote.status]}`}
                    >
                      {quote.status.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
