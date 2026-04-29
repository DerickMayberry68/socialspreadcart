import type { Metadata } from "next";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";

import { withCurrentTenant } from "@/lib/tenant";
import { EventManager } from "@/components/admin/event-manager";
import { EventService } from "@/services/event-service";

export const metadata: Metadata = { title: "Events | Admin" };

export default async function AdminEventsPage() {
  const events = await withCurrentTenant(EventService.listEvents);
  const upcoming = events.filter((event) => new Date(event.date) >= new Date()).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-7 py-7 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[#d7e2d4]">Events</p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.95]">
            Manage events on your public calendar.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#eef2ed]/84">
            Schedule public appearances, keep listings current, and present upcoming
            moments with the same polish customers see on the front end.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] border border-[#e4dbc9] bg-[#fffaf4] px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Upcoming</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">{upcoming}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Events still ahead on the public calendar.
            </p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Total records</p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">{events.length}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              All events, past and upcoming.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-sage/10 bg-white px-5 py-5 shadow-soft">
          <CalendarDays className="h-5 w-5 text-[#4f684d]" />
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/45">Clear timing</p>
          <p className="mt-2 text-sm leading-7 text-ink/62">
            Dates and times should be easy to scan at a glance.
          </p>
        </div>
        <div className="rounded-[24px] border border-sage/10 bg-[#fffaf4] px-5 py-5 shadow-soft">
          <MapPin className="h-5 w-5 text-[#ad7a54]" />
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/45">Location-rich</p>
          <p className="mt-2 text-sm leading-7 text-ink/62">
            Include venue context so guests instantly know where to meet you.
          </p>
        </div>
        <div className="rounded-[24px] border border-sage/10 bg-white px-5 py-5 shadow-soft">
          <Sparkles className="h-5 w-5 text-[#a15e50]" />
          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/45">Brand-aligned</p>
          <p className="mt-2 text-sm leading-7 text-ink/62">
            Keep event descriptions warm, inviting, and visually clean.
          </p>
        </div>
      </section>

      <EventManager initial={events} />
    </div>
  );
}
