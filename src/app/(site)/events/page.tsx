import type { Metadata } from "next";

import { EventsCalendar } from "@/components/sections/events-calendar";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { getEvents } from "@/lib/data";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata: Metadata = {
  title: "Events Calendar",
  description:
    "Browse upcoming pop-ups, public tasting events, and appearances from The Social Spread Cart.",
};

export default async function EventsPage() {
  const [events, pageContent] = await Promise.all([
    getEvents(),
    withCurrentTenant((tenantId) =>
      SiteContentService.getMarketingPageContent(tenantId, "events"),
    ),
  ]);
  const content = pageContent.content;

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {content.cards.map((card) => (
            <Card key={card.eyebrow} className="rounded-[30px] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                {card.eyebrow}
              </p>
              <p className="mt-3 text-base leading-7 text-ink/66">{card.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <EventsCalendar events={events} />
        </div>
      </SectionShell>
    </div>
  );
}
