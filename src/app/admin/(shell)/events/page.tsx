import type { Metadata } from "next";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EventManager } from "@/components/admin/event-manager";
import type { EventItem } from "@/lib/types";

export const metadata: Metadata = { title: "Events | Admin" };

async function getEvents() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  return (data ?? []) as EventItem[];
}

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl text-sage">Events</h1>
        <p className="mt-1 text-sm text-ink/55">
          Create and manage public pop-ups and appearances on the calendar.
        </p>
      </div>
      <EventManager initial={events} />
    </div>
  );
}
