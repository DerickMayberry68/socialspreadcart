import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventItem } from "@/lib/types";

const tenantIdSchema = z.string().uuid();

const eventFieldsSchema = z.object({
  title: z.string().min(2),
  date: z.string().min(1),
  location: z.string().min(2),
  description: z.string().min(2),
  image_url: z.string().url().optional().or(z.literal("")),
  join_url: z.string().url().optional().or(z.literal("")),
});

const createEventSchema = eventFieldsSchema.extend({
  tenantId: tenantIdSchema,
});

const updateEventSchema = createEventSchema.extend({
  id: z.string().min(1),
});

const deleteEventSchema = z.object({
  tenantId: tenantIdSchema,
  id: z.string().min(1),
});

async function listEvents(tenantId: string): Promise<EventItem[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as EventItem[];
}

async function listUpcomingEvents(tenantId: string): Promise<EventItem[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, title, date, location, description, image_url, join_url")
    .eq("tenant_id", tenantId)
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as EventItem[];
}

async function createEvent(input: z.input<typeof createEventSchema>): Promise<EventItem> {
  const parsed = createEventSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      id: crypto.randomUUID(),
      tenant_id: parsed.tenantId,
      title: parsed.title,
      date: parsed.date,
      location: parsed.location,
      description: parsed.description,
      image_url: parsed.image_url || "",
      join_url: parsed.join_url || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create event.");
  }

  return data as EventItem;
}

async function updateEvent(input: z.input<typeof updateEventSchema>): Promise<EventItem> {
  const parsed = updateEventSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      tenant_id: parsed.tenantId,
      title: parsed.title,
      date: parsed.date,
      location: parsed.location,
      description: parsed.description,
      image_url: parsed.image_url || "",
      join_url: parsed.join_url || null,
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update event.");
  }

  return data as EventItem;
}

async function deleteEvent(input: z.input<typeof deleteEventSchema>): Promise<void> {
  const parsed = deleteEventSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.id);

  if (error) {
    throw new Error(error.message);
  }
}

export const EventService = {
  listEvents,
  listUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
