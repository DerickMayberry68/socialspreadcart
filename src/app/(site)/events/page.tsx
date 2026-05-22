import type { Metadata } from "next";

import { EventsCalendar } from "@/components/sections/events-calendar";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { getEvents } from "@/lib/data";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata: Metadata = {
  title: "Pop-Ups & Events in Northwest Arkansas",
  description:
    "Browse upcoming pop-ups, public tasting events, and appearances from The Social Spread Cart.",
  alternates: {
    canonical: "/events",
  },
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
          as="h1"
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {content.cards.map((card) => (
            <Card
              key={card.eyebrow}
              className="rounded-[30px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-6 shadow-[0_24px_60px_rgba(56,66,44,0.2)] backdrop-blur-xl"
            >
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
