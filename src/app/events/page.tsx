import type { Metadata } from "next";

import { EventsCalendar } from "@/components/sections/events-calendar";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { getEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events Calendar",
  description:
    "Browse upcoming pop-ups, public tasting events, and appearances from The Social Spread Cart.",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Events Calendar"
          title="Keep up with public pop-ups, tastings, and upcoming appearances."
          description="Dates are managed through Supabase so future events can be added quickly by an admin user or from the Supabase dashboard."
        />
        <div className="mt-12">
          <EventsCalendar events={events} />
        </div>
      </SectionShell>
    </div>
  );
}
