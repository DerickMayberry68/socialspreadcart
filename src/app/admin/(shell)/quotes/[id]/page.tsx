import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import { withCurrentTenant } from "@/lib/tenant";
import { QuoteStatusSelect } from "@/components/admin/quote-status-select";
import { getQuoteDetail } from "@/services/quote-service";

export const metadata: Metadata = { title: "Quote Detail | Admin" };

async function getQuote(id: string) {
  return withCurrentTenant(getQuoteDetail, id);
}

const statusStyles: Record<string, string> = {
  new: "bg-[#f5e7d4] text-[#9a6c44]",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-[#eef4e9] text-[#4f684d]",
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
    <div className="space-y-8">
      <section className="rounded-[32px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-7 py-7 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#d7e2d4] transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to quotes
        </Link>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#d7e2d4]">Quote detail</p>
            <h1 className="mt-4 font-heading text-5xl leading-[0.95]">{quote.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#eef2ed]/82">
              Submitted{" "}
              {new Date(quote.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              for a {quote.event_type.toLowerCase()} request.
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] ${statusStyles[quote.status] ?? "bg-ink/10 text-ink/50"}`}
          >
            {quote.status.replace("_", " ")}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#4f684d]" />
              <h2 className="font-heading text-3xl text-[#284237]">Event details</h2>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-[20px] bg-[#fffaf4] px-5 py-4">
                <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Event date</dt>
                <dd className="mt-2 text-sm leading-7 text-ink">
                  {new Date(quote.event_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="rounded-[20px] bg-[#fffaf4] px-5 py-4">
                <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Guests</dt>
                <dd className="mt-2 flex items-center gap-2 text-sm text-ink">
                  <Users className="h-4 w-4 text-ink/35" />
                  {quote.guests}
                </dd>
              </div>
              <div className="rounded-[20px] bg-[#fffaf4] px-5 py-4 sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">Event type</dt>
                <dd className="mt-2 text-sm text-ink">{quote.event_type}</dd>
              </div>
              <div className="rounded-[20px] bg-[#fffaf4] px-5 py-4 sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.13em] text-ink/45">
                  Services requested
                </dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {quote.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.12em] text-[#4f684d] shadow-soft"
                    >
                      {service}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          {quote.message && (
            <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#a15e50]" />
                <h2 className="font-heading text-3xl text-[#284237]">Customer message</h2>
              </div>
              <p className="mt-5 rounded-[20px] bg-[#fffaf4] px-5 py-5 text-sm leading-7 text-ink/72">
                {quote.message}
              </p>
            </section>
          )}

          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                  Status controls
                </p>
                <h2 className="mt-3 font-heading text-3xl text-[#284237]">
                  Move the quote forward with one clear action.
                </h2>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d]">
                <Sparkles className="h-3.5 w-3.5" />
                Current: {quote.status.replace("_", " ")}
              </div>
            </div>
            <div className="mt-6">
              <QuoteStatusSelect
                quoteId={quote.id}
                contactId={quote.contact_id}
                current={quote.status}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-[#284237]">Contact details</h2>
            <div className="mt-5 space-y-4">
              <a
                href={`mailto:${quote.email}`}
                className="flex items-center gap-3 rounded-[18px] bg-[#fffaf4] px-4 py-4 text-sm text-ink transition hover:bg-[#f8f0e4] hover:text-sage"
              >
                <Mail className="h-4 w-4 text-[#4f684d]" />
                {quote.email}
              </a>
              <a
                href={`tel:${quote.phone}`}
                className="flex items-center gap-3 rounded-[18px] bg-[#fffaf4] px-4 py-4 text-sm text-ink transition hover:bg-[#f8f0e4] hover:text-sage"
              >
                <Phone className="h-4 w-4 text-[#4f684d]" />
                {quote.phone}
              </a>
            </div>

            {contact ? (
              <div className="mt-6 border-t border-sage/10 pt-6">
                <p className="text-xs uppercase tracking-[0.15em] text-ink/45">Linked contact</p>
                <Link
                  href={`/admin/contacts/${contact.id}`}
                  className="mt-3 flex items-center gap-3 rounded-[20px] border border-sage/10 bg-[#fcf8f1] px-4 py-4 transition hover:border-sage/20 hover:bg-[#fffaf4]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-heading text-lg text-[#284237]">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{contact.name}</p>
                    <p className="text-xs capitalize text-ink/50">{contact.status}</p>
                  </div>
                </Link>
              </div>
            ) : (
              <p className="mt-6 text-sm text-ink/45">No CRM contact linked to this quote yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
