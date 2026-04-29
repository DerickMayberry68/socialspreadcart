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

type EventRow = {
  id: number | string;
  title: string;
  event_date: string;
  start_time?: string | null;
  location?: string | null;
  description?: string | null;
  image_url?: string | null;
};

function toEventItem(row: EventRow): EventItem {
  const time = row.start_time ? row.start_time.slice(0, 5) : "00:00";

  return {
    id: String(row.id),
    title: row.title,
    date: `${row.event_date}T${time}`,
    location: row.location ?? "",
    description: row.description ?? "",
    image_url: row.image_url ?? "",
  };
}

function toEventDateParts(dateTime: string) {
  const [eventDate, time = "00:00"] = dateTime.split("T");
  return {
    event_date: eventDate,
    start_time: time.length === 5 ? `${time}:00` : time,
  };
}

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
    .order("event_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as EventRow[]).map(toEventItem);
}

async function listUpcomingEvents(tenantId: string): Promise<EventItem[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_date, start_time, location, description, image_url")
    .eq("tenant_id", tenantId)
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as EventRow[]).map(toEventItem);
}

async function createEvent(input: z.input<typeof createEventSchema>): Promise<EventItem> {
  const parsed = createEventSchema.parse(input);
  const dateParts = toEventDateParts(parsed.date);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      id: Date.now(),
      tenant_id: parsed.tenantId,
      title: parsed.title,
      ...dateParts,
      location: parsed.location,
      description: parsed.description,
      image_url: parsed.image_url || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create event.");
  }

  return toEventItem(data as EventRow);
}

async function updateEvent(input: z.input<typeof updateEventSchema>): Promise<EventItem> {
  const parsed = updateEventSchema.parse(input);
  const dateParts = toEventDateParts(parsed.date);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      tenant_id: parsed.tenantId,
      title: parsed.title,
      ...dateParts,
      location: parsed.location,
      description: parsed.description,
      image_url: parsed.image_url || null,
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update event.");
  }

  return toEventItem(data as EventRow);
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
