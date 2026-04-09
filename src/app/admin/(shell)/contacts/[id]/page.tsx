import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ContactStatusSelect } from "@/components/admin/contact-status-select";
import { InteractionTimeline } from "@/components/admin/interaction-timeline";
import type { Contact, Interaction, Quote } from "@/lib/types";

export const metadata: Metadata = { title: "Contact Detail | Admin" };

async function getContact(id: string) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const [contactRes, interactionsRes, quotesRes] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).single(),
    supabase
      .from("interactions")
      .select("*, profile:profiles(id, full_name)")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, event_date, event_type, guests, services, status, created_at")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (contactRes.error || !contactRes.data) return null;

  return {
    contact: contactRes.data as Contact,
    interactions: (interactionsRes.data ?? []) as Interaction[],
    quotes: (quotesRes.data ?? []) as Quote[],
  };
}

const quoteStatusStyles: Record<string, string> = {
  new: "bg-gold/15 text-gold",
  in_progress: "bg-blue-50 text-blue-700",
  booked: "bg-sage/15 text-sage",
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
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/contacts"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-ink/45 transition hover:text-sage"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Contacts
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 font-heading text-3xl text-sage">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-4xl text-sage">{contact.name}</h1>
            <p className="mt-0.5 text-sm text-ink/50">
              {contact.source === "quote" ? "Quote inquiry" : "Contact form"} &middot; Added{" "}
              {new Date(contact.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Contact info card */}
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-sage">Contact Info</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-sage/60" />
                <a href={`mailto:${contact.email}`} className="text-ink transition hover:text-sage">
                  {contact.email}
                </a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-sage/60" />
                  <a href={`tel:${contact.phone}`} className="text-ink transition hover:text-sage">
                    {contact.phone}
                  </a>
                </div>
              )}
            </dl>

            {contact.notes && (
              <div className="mt-5 border-t border-sage/10 pt-4">
                <p className="text-xs uppercase tracking-[0.13em] text-ink/45">Notes</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-sage">Status</h2>
            <p className="mt-1 text-xs text-ink/45">
              Current:{" "}
              <span className="font-medium capitalize text-ink">{contact.status}</span>
            </p>
            <div className="mt-4">
              <ContactStatusSelect contactId={contact.id} current={contact.status} />
            </div>
          </div>

          {/* Interaction timeline */}
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="mb-5 font-heading text-2xl text-sage">Timeline</h2>
            <InteractionTimeline contactId={contact.id} initial={interactions} />
          </div>
        </div>

        {/* Right column — linked quotes */}
        <div className="space-y-4">
          <div className="rounded-[20px] border border-sage/15 bg-white p-6 shadow-soft">
            <h2 className="font-heading text-2xl text-sage">Quotes</h2>
            {quotes.length === 0 ? (
              <p className="mt-4 text-sm text-ink/40">No quotes linked to this contact.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {quotes.map((quote) => (
                  <li key={quote.id}>
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="block rounded-[14px] border border-sage/15 p-4 transition hover:border-sage/30 hover:bg-sage/5"
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
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            quoteStatusStyles[quote.status] ?? "bg-ink/10 text-ink/50"
                          }`}
                        >
                          {quote.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-ink">{quote.event_type}</p>
                      <p className="mt-0.5 text-xs text-ink/50">
                        {quote.guests} guests &middot; {quote.services.join(", ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
