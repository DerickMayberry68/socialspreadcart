import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, Mail, Phone, MessageSquare } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { QuoteStatusSelect } from "@/components/admin/quote-status-select";
import type { Quote, Contact } from "@/lib/types";

export const metadata: Metadata = { title: "Quote Detail | Admin" };

async function getQuote(id: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const quote = data as Quote;

  let contact: Contact | null = null;
  if (quote.contact_id) {
    const { data: cd } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", quote.contact_id)
      .single();
    contact = (cd as Contact) ?? null;
  }

  return { quote, contact };
}

const statusStyles: Record<string, string> = {
  new: "bg-gold/15 text-gold",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-sage/15 text-sage",
  closed: "bg-ink/10 text-ink/50",
  lost: "bg-red-50 text-red-600",
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getQuote(id);
  if (!result) notFound();

  const { quote, contact } = result;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quotes
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="font-heading text-4xl text-sage">{quote.name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${statusStyles[quote.status] ?? "bg-ink/10 text-ink/50"}`}
          >
            {quote.status.replace("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/50">
          Submitted{" "}
          {new Date(quote.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Left — quote details */}
        <div className="space-y-5">
          {/* Event details */}
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-sage">Event Details</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-sage/60" />
                <div>
                  <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Event Date</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {new Date(quote.event_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-sage/60" />
                <div>
                  <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Guests</dt>
                  <dd className="mt-0.5 text-sm text-ink">{quote.guests}</dd>
                </div>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Event Type</dt>
                <dd className="mt-0.5 text-sm text-ink">{quote.event_type}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Services Requested</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {quote.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-sage/20 bg-sage/8 px-3 py-1 text-xs text-sage"
                    >
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Message */}
          {quote.message && (
            <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sage/60" />
                <h2 className="font-heading text-2xl text-sage">Message</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/70">{quote.message}</p>
            </div>
          )}

          {/* Status management */}
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-sage">Update Status</h2>
            <p className="mt-1 text-xs text-ink/45">
              Current:{" "}
              <span className="font-medium capitalize text-ink">
                {quote.status.replace("_", " ")}
              </span>
            </p>
            <div className="mt-4">
              <QuoteStatusSelect
                quoteId={quote.id}
                contactId={quote.contact_id}
                current={quote.status}
              />
            </div>
          </div>
        </div>

        {/* Right — contact info */}
        <div className="space-y-5">
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-sage">Contact</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-sage/60" />
                <a
                  href={`mailto:${quote.email}`}
                  className="text-ink transition hover:text-sage"
                >
                  {quote.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-sage/60" />
                <a
                  href={`tel:${quote.phone}`}
                  className="text-ink transition hover:text-sage"
                >
                  {quote.phone}
                </a>
              </div>
            </dl>

            {contact ? (
              <div className="mt-5 border-t border-sage/10 pt-4">
                <p className="text-xs uppercase tracking-[0.13em] text-ink/45">
                  CRM Contact
                </p>
                <Link
                  href={`/admin/contacts/${contact.id}`}
                  className="mt-2 flex items-center gap-3 rounded-[14px] border border-sage/15 p-3 transition hover:border-sage/30 hover:bg-sage/5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15 font-heading text-lg text-sage">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {contact.name}
                    </p>
                    <p className="text-xs capitalize text-ink/50">
                      {contact.status}
                    </p>
                  </div>
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-xs text-ink/35">
                No CRM contact linked.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
