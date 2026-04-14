import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Contact, ContactStatus, Interaction, Quote } from "@/lib/types";

const tenantIdSchema = z.string().uuid();
const contactStatusSchema = z.enum(["new", "contacted", "booked", "closed"]);

const updateContactStatusSchema = z.object({
  tenantId: tenantIdSchema,
  contactId: z.string().uuid(),
  status: contactStatusSchema,
  previousStatus: contactStatusSchema.optional(),
});

async function listContacts(
  tenantId: string,
  search?: string,
  status?: string,
): Promise<Contact[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data as Contact[];
}

async function getRecentContacts(
  tenantId: string,
  limit = 6,
): Promise<Contact[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, email, source, status, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as Contact[];
}

async function getContactStatusCounts(tenantId: string) {
  tenantIdSchema.parse(tenantId);

  const contacts = await listContacts(tenantId);

  return {
    total: contacts.length,
    new: contacts.filter((contact) => contact.status === "new").length,
    contacted: contacts.filter((contact) => contact.status === "contacted").length,
    booked: contacts.filter((contact) => contact.status === "booked").length,
    closed: contacts.filter((contact) => contact.status === "closed").length,
  };
}

async function getContactDetail(
  tenantId: string,
  contactId: string,
): Promise<{ contact: Contact; interactions: Interaction[]; quotes: Quote[] } | null> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const [contactRes, interactionsRes, quotesRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", contactId)
      .single(),
    supabase
      .from("interactions")
      .select("*, profile:profiles(id, full_name)")
      .eq("tenant_id", tenantId)
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, event_date, event_type, guests, services, status, created_at, updated_at, contact_id, name, email, phone, message")
      .eq("tenant_id", tenantId)
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
  ]);

  if (contactRes.error || !contactRes.data) {
    return null;
  }

  return {
    contact: contactRes.data as Contact,
    interactions: (interactionsRes.data ?? []) as Interaction[],
    quotes: (quotesRes.data ?? []) as Quote[],
  };
}

async function updateContactStatus(
  input: z.input<typeof updateContactStatusSchema>,
): Promise<void> {
  const parsed = updateContactStatusSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      tenant_id: parsed.tenantId,
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.contactId);

  if (error) {
    throw new Error(error.message);
  }

  const body = parsed.previousStatus
    ? `Status changed from "${parsed.previousStatus}" to "${parsed.status}"`
    : `Status changed to "${parsed.status}"`;

  const { error: interactionError } = await supabase.from("interactions").insert({
    tenant_id: parsed.tenantId,
    contact_id: parsed.contactId,
    type: "status_change",
    body,
  });

  if (interactionError) {
    throw new Error(interactionError.message);
  }
}

export const ContactService = {
  listContacts,
  getRecentContacts,
  getContactStatusCounts,
  getContactDetail,
  updateContactStatus,
};
