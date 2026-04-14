import type { Metadata } from "next";

import { EventsCalendar } from "@/components/sections/events-calendar";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
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
          description="A live events rhythm makes the brand feel active between private bookings and gives returning guests a reason to keep checking in."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card className="rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Easy to scan</p>
            <p className="mt-3 text-base leading-7 text-ink/66">
              Public events should feel discoverable at a glance, even for busy hosts planning around family or work schedules.
            </p>
          </Card>
          <Card className="rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Always current</p>
            <p className="mt-3 text-base leading-7 text-ink/66">
              Dates are managed through Supabase so future events can be added quickly by the admin team.
            </p>
          </Card>
          <Card className="rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Made for return visits</p>
            <p className="mt-3 text-base leading-7 text-ink/66">
              This page gives loyal customers a simple way to keep tabs on pop-ups, tastings, and seasonal moments.
            </p>
          </Card>
        </div>

        <div className="mt-12">
          <EventsCalendar events={events} />
        </div>
      </SectionShell>
    </div>
  );
}
