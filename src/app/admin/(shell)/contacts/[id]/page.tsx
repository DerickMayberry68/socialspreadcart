import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import { withCurrentTenant } from "@/lib/tenant";
import { ContactStatusSelect } from "@/components/admin/contact-status-select";
import { InteractionTimeline } from "@/components/admin/interaction-timeline";
import { ContactService } from "@/services/contact-service";

export const metadata: Metadata = { title: "Contact Detail | Admin" };

async function getContact(id: string) {
  return withCurrentTenant(ContactService.getContactDetail, id);
}

const quoteStatusStyles: Record<string, string> = {
  new: "bg-[#f5e7d4] text-[#9a6c44]",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-[#eef4e9] text-[#4f684d]",
  closed: "bg-ink/10 text-ink/50",
  lost: "bg-red-50 text-red-600",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getContact(id);
  if (!result) notFound();

  const { contact, interactions, quotes } = result;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[#e4dbc9] bg-[#fffaf4] px-7 py-7 shadow-soft">
        <Link
          href="/admin/contacts"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-ink/45 transition hover:text-sage"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to contacts
        </Link>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white font-heading text-3xl text-[#284237] shadow-soft">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">Contact detail</p>
              <h1 className="mt-4 font-heading text-5xl leading-[0.95] text-[#284237]">
                {contact.name}
              </h1>
              <p className="mt-3 text-sm leading-7 text-ink/62">
                {contact.source === "quote" ? "Quote inquiry" : "Contact form"} | Added{" "}
                {new Date(contact.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d]">
            <Users className="h-3.5 w-3.5" />
            {contact.status}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-[#284237]">Contact info</h2>
            <div className="mt-5 space-y-4">
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 rounded-[18px] bg-[#fffaf4] px-4 py-4 text-sm text-ink transition hover:bg-[#f8f0e4] hover:text-sage"
              >
                <Mail className="h-4 w-4 text-[#4f684d]" />
                {contact.email}
              </a>
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 rounded-[18px] bg-[#fffaf4] px-4 py-4 text-sm text-ink transition hover:bg-[#f8f0e4] hover:text-sage"
                >
                  <Phone className="h-4 w-4 text-[#4f684d]" />
                  {contact.phone}
                </a>
              )}
            </div>

            {contact.notes && (
              <div className="mt-6 border-t border-sage/10 pt-6">
                <p className="text-xs uppercase tracking-[0.15em] text-ink/45">Notes</p>
                <p className="mt-3 rounded-[20px] bg-[#fffaf4] px-5 py-5 text-sm leading-7 text-ink/72">
                  {contact.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                  Relationship status
                </p>
                <h2 className="mt-3 font-heading text-3xl text-[#284237]">
                  Keep the contact journey easy to read.
                </h2>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d]">
                <Sparkles className="h-3.5 w-3.5" />
                Current: {contact.status}
              </div>
            </div>
            <div className="mt-6">
              <ContactStatusSelect contactId={contact.id} current={contact.status} />
            </div>
          </section>

          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-[#284237]">Timeline</h2>
            <p className="mt-2 text-sm text-ink/50">
              Notes, status changes, and follow-up history in one place.
            </p>
            <div className="mt-6">
              <InteractionTimeline contactId={contact.id} initial={interactions} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-3xl text-[#284237]">Linked quotes</h2>
            {quotes.length === 0 ? (
              <p className="mt-4 text-sm text-ink/45">No quotes linked to this contact yet.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {quotes.map((quote) => (
                  <li key={quote.id}>
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="block rounded-[20px] border border-sage/10 bg-[#fcf8f1] px-4 py-4 transition hover:border-sage/20 hover:bg-[#fffaf4]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-ink/50">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(quote.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            quoteStatusStyles[quote.status] ?? "bg-ink/10 text-ink/50"
                          }`}
                        >
                          {quote.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-ink">{quote.event_type}</p>
                      <p className="mt-1 text-xs text-ink/50">
                        {quote.guests} guests | {quote.services.join(", ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
