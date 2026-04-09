import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Clock, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Quote, QuoteStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Quotes | Admin" };

const statusStyles: Record<QuoteStatus, string> = {
  new: "bg-gold/15 text-gold",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-sage/15 text-sage",
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
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { quotes: [], counts: { new: 0, in_progress: 0, booked: 0, closed: 0, lost: 0, total: 0 } };

  let query = supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,event_type.ilike.%${search}%`);

  const { data } = await query;
  const quotes = (data ?? []) as Quote[];

  const { data: allData } = await supabase.from("quotes").select("status");
  const all = (allData ?? []) as Pick<Quote, "status">[];
  const counts = {
    total: all.length,
    new: all.filter((q) => q.status === "new").length,
    in_progress: all.filter((q) => q.status === "in_progress").length,
    booked: all.filter((q) => q.status === "booked").length,
    closed: all.filter((q) => q.status === "closed").length,
    lost: all.filter((q) => q.status === "lost").length,
  };

  return { quotes, counts };
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { quotes, counts } = await getQuotes(params.search, params.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl text-sage">Quotes</h1>
        <p className="mt-1 text-sm text-ink/55">
          {counts.total} total &mdash; incoming quote requests and bookings
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {(["new", "in_progress", "booked", "closed", "lost"] as QuoteStatus[]).map((s) => {
          const Icon = statusIcons[s];
          return (
            <Link
              key={s}
              href={`/admin/quotes?status=${s}`}
              className={`flex items-center gap-3 rounded-[16px] border px-4 py-3.5 transition hover:shadow-soft ${
                params.status === s
                  ? "border-sage/30 bg-sage/10"
                  : "border-sage/15 bg-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 text-sage/60" />
              <div>
                <p className="text-xs uppercase tracking-[0.13em] text-ink/50">
                  {s.replace("_", " ")}
                </p>
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
          placeholder="Search name, email, or event type…"
          className="flex-1 rounded-[14px] border border-sage/20 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
        />
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="rounded-[14px] border border-sage/20 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-sage"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="booked">Booked</option>
          <option value="closed">Closed</option>
          <option value="lost">Lost</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-sage px-6 py-2.5 text-sm font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700"
        >
          Filter
        </button>
        {(params.search || params.status) && (
          <Link
            href="/admin/quotes"
            className="rounded-full border border-sage/20 px-6 py-2.5 text-center text-sm uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-[20px] border border-sage/15 bg-white shadow-soft">
        {quotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-ink/20" />
            <p className="mt-4 text-sm text-ink/40">No quotes found.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden grid-cols-[1fr_160px_120px_100px_80px] gap-4 border-b border-sage/10 px-6 py-3 text-xs uppercase tracking-[0.13em] text-ink/40 sm:grid">
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
                    className="grid grid-cols-1 gap-2 px-6 py-4 transition hover:bg-sage/5 sm:grid-cols-[1fr_160px_120px_100px_80px] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{quote.name}</p>
                      <p className="truncate text-xs text-ink/50">{quote.email}</p>
                    </div>
                    <p className="truncate text-sm text-ink/70">{quote.event_type}</p>
                    <p className="text-sm text-ink/70">
                      {new Date(quote.event_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-ink/70">{quote.guests}</p>
                    <span
                      className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[quote.status]}`}
                    >
                      {quote.status.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
