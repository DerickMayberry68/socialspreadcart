import { z } from "zod";

import { hasSupabaseServiceEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { Contact, Quote, QuoteStatus, QuoteRequest } from "@/lib/types";

export type SubmitQuoteResult =
  | { ok: true }
  | { ok: false; message: string; status: number };

const submitQuoteSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventDate: z.string().min(1),
  eventType: z.string().min(1),
  guests: z.string().min(1),
  services: z.array(z.string().min(1)).min(1),
  message: z.string().optional().default(""),
});

const tenantIdSchema = z.string().uuid();

const updateQuoteStatusSchema = z.object({
  tenantId: tenantIdSchema,
  quoteId: z.string().uuid(),
  status: z.enum(["new", "in_progress", "booked", "closed", "lost"]),
  contactId: z.string().uuid().optional().nullable(),
});

export async function listQuotes(
  tenantId: string,
  search?: string,
  status?: string,
): Promise<Quote[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("quotes")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,event_type.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as Quote[];
}

export async function getRecentQuotes(
  tenantId: string,
  limit = 6,
): Promise<Quote[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("id, name, email, event_date, services, status, created_at, updated_at, contact_id, phone, event_type, guests, message")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as Quote[];
}

export async function getQuoteStatusCounts(tenantId: string): Promise<Record<QuoteStatus | "total", number>> {
  const quotes = await listQuotes(tenantId);

  return {
    total: quotes.length,
    new: quotes.filter((quote) => quote.status === "new").length,
    in_progress: quotes.filter((quote) => quote.status === "in_progress").length,
    booked: quotes.filter((quote) => quote.status === "booked").length,
    closed: quotes.filter((quote) => quote.status === "closed").length,
    lost: quotes.filter((quote) => quote.status === "lost").length,
  };
}

export async function getQuoteDetail(
  tenantId: string,
  quoteId: string,
): Promise<{ quote: Quote; contact: Contact | null } | null> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", quoteId)
    .single();

  if (error || !data) {
    return null;
  }

  const quote = data as Quote;

  let contact: Contact | null = null;
  if (quote.contact_id) {
    const { data: contactData } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", quote.contact_id)
      .single();

    contact = (contactData as Contact) ?? null;
  }

  return { quote, contact };
}

export async function updateQuoteStatus(
  input: z.input<typeof updateQuoteStatusSchema>,
): Promise<void> {
  const parsed = updateQuoteStatusSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { error } = await supabase
    .from("quotes")
    .update({
      tenant_id: parsed.tenantId,
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.quoteId);

  if (error) {
    throw new Error(error.message);
  }

  if (parsed.contactId && (parsed.status === "booked" || parsed.status === "closed")) {
    const contactStatus = parsed.status === "booked" ? "booked" : "closed";

    const { error: contactError } = await supabase
      .from("contacts")
      .update({
        tenant_id: parsed.tenantId,
        status: contactStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", parsed.tenantId)
      .eq("id", parsed.contactId);

    if (contactError) {
      throw new Error(contactError.message);
    }

    const { error: interactionError } = await supabase.from("interactions").insert({
      tenant_id: parsed.tenantId,
      contact_id: parsed.contactId,
      type: "status_change",
      body: `Quote status changed to "${parsed.status.replace("_", " ")}"`,
    });

    if (interactionError) {
      throw new Error(interactionError.message);
    }
  }
}

export async function submitQuote(
  payload: QuoteRequest,
): Promise<SubmitQuoteResult> {
  const parsed = submitQuoteSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      ok: false,
      message: issue ? `${issue.path.join(".") || "payload"} is invalid.` : "Invalid payload.",
      status: 400,
    };
  }

  if (!hasSupabaseServiceEnv()) {
    return { ok: true };
  }

  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    return { ok: false, message: "Supabase service client is unavailable.", status: 500 };
  }

  const input = parsed.data;
  const lowerEmail = input.email.toLowerCase();

  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("email", lowerEmail)
    .maybeSingle();

  let contactId: string | undefined;

  if (existing?.id) {
    await supabase
      .from("contacts")
      .update({
        tenant_id: input.tenantId,
        name: input.name,
        phone: input.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", input.tenantId)
      .eq("id", existing.id);
    contactId = existing.id as string;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert({
        tenant_id: input.tenantId,
        name: input.name,
        email: lowerEmail,
        phone: input.phone,
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
      tenant_id: input.tenantId,
      contact_id: contactId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      event_date: input.eventDate,
      event_type: input.eventType,
      guests: input.guests,
      services: input.services,
      message: input.message,
    })
    .select("id")
    .single();

  if (quoteError) {
    return { ok: false, message: quoteError.message, status: 500 };
  }

  if (contactId) {
    await supabase.from("interactions").insert({
      tenant_id: input.tenantId,
      contact_id: contactId,
      type: "quote_submitted",
      body: `Quote #${String(quoteData?.id ?? "").slice(0, 8)} - ${input.eventType} for ${input.guests} guests on ${input.eventDate}. Services: ${input.services.join(", ")}.`,
    });
  }

  return { ok: true };
}
