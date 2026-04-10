import { createClient } from "@supabase/supabase-js";

import { hasSupabaseServiceEnv } from "@/lib/supabase/env";
import type { QuoteRequest } from "@/lib/types";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export type SubmitQuoteResult =
  | { ok: true }
  | { ok: false; message: string; status: number };

export async function submitQuote(
  payload: QuoteRequest,
): Promise<SubmitQuoteResult> {
  if (!hasSupabaseServiceEnv()) {
    return { ok: true };
  }

  const supabase = getServiceClient();
  const lowerEmail = payload.email.toLowerCase();

  // Find or create contact
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("email", lowerEmail)
    .maybeSingle();

  let contactId: string | undefined;

  if (existing?.id) {
    await supabase
      .from("contacts")
      .update({ name: payload.name, phone: payload.phone })
      .eq("id", existing.id);
    contactId = existing.id as string;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert({
        name: payload.name,
        email: lowerEmail,
        phone: payload.phone,
        source: "quote",
      })
      .select("id")
      .single();

    if (insertError) {
      return { ok: false, message: insertError.message, status: 500 };
    }
    contactId = inserted?.id as string | undefined;
  }

  const { data: quoteData, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      contact_id: contactId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      event_date: payload.eventDate,
      event_type: payload.eventType,
      guests: payload.guests,
      services: payload.services,
      message: payload.message,
    })
    .select("id")
    .single();

  if (quoteError) {
    return { ok: false, message: quoteError.message, status: 500 };
  }

  if (contactId) {
    await supabase.from("interactions").insert({
      contact_id: contactId,
      type: "quote_submitted",
      body: `Quote #${String(quoteData?.id ?? "").slice(0, 8)} — ${payload.eventType} for ${payload.guests} guests on ${payload.eventDate}. Services: ${payload.services.join(", ")}.`,
    });
  }

  return { ok: true };
}
