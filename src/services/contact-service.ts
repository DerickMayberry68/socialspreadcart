import { z } from "zod";

import { createPagedResult } from "@/lib/admin/list-query";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AdminListQuery,
  Contact,
  Interaction,
  PagedResult,
  Quote,
} from "@/lib/types";

const tenantIdSchema = z.string().uuid();
const contactStatusSchema = z.enum(["new", "contacted", "booked", "closed"]);

const updateContactStatusSchema = z.object({
  tenantId: tenantIdSchema,
  contactId: z.string().uuid(),
  status: contactStatusSchema,
  previousStatus: contactStatusSchema.optional(),
});

const contactSortColumns = {
  name: "name",
  email: "email",
  source: "source",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at",
} as const;

export type ContactSort = keyof typeof contactSortColumns;
export type ContactListOptions = Partial<AdminListQuery<ContactSort>>;

function isContactListOptions(value: unknown): value is ContactListOptions {
  return typeof value === "object" && value !== null;
}

async function listContacts(
  tenantId: string,
  search?: string,
  status?: string,
): Promise<Contact[]> {
  return listContactsInternal(tenantId, { search, status }, false) as Promise<Contact[]>;
}

async function listContactsPage(
  tenantId: string,
  options: ContactListOptions,
): Promise<PagedResult<Contact>> {
  return listContactsInternal(tenantId, options, true) as Promise<PagedResult<Contact>>;
}

async function listContactsInternal(
  tenantId: string,
  searchOrOptions?: string | ContactListOptions,
  pagedStatusOrPaged?: string | boolean,
  forcePaged = false,
): Promise<Contact[] | PagedResult<Contact>> {
  tenantIdSchema.parse(tenantId);
  const options = isContactListOptions(searchOrOptions)
    ? searchOrOptions
    : { search: searchOrOptions, status: typeof pagedStatusOrPaged === "string" ? pagedStatusOrPaged : undefined };
  const paged = forcePaged || pagedStatusOrPaged === true;

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return paged
      ? createPagedResult<Contact>([], 0, options.page ?? 1, options.pageSize ?? 25)
      : [];
  }

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 25);
  const sort = options.sort && options.sort in contactSortColumns
    ? contactSortColumns[options.sort as ContactSort]
    : "created_at";
  const direction = options.direction ?? "desc";
  let query = supabase
    .from("contacts")
    .select("*", paged ? { count: "exact" } : undefined)
    .eq("tenant_id", tenantId)
    .order(sort, { ascending: direction === "asc" });

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
  }

  if (paged) {
    query = query.range((page - 1) * pageSize, page * pageSize - 1);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    return paged ? createPagedResult<Contact>([], 0, page, pageSize) : [];
  }

  const records = data as Contact[];
  return paged
    ? createPagedResult(records, count ?? records.length, page, pageSize)
    : records;
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
  listContactsPage,
  getRecentContacts,
  getContactStatusCounts,
  getContactDetail,
  updateContactStatus,
};
