import type { Metadata } from "next";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";

import { QuoteForm } from "@/components/sections/quote-form";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote from The Social Spread Cart for charcuterie boxes, cups, dirty soda, mini pancake bar service, bartending, and cart service in NWA.",
};

export default async function ContactPage() {
  const pageContent = await withCurrentTenant((tenantId) =>
    SiteContentService.getMarketingPageContent(tenantId, "contact"),
  );
  const content = pageContent.content;
  const icons = [MapPin, Phone, Mail, Clock3] as const;

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-5">
            <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-8">
              <h3 className="font-heading text-4xl text-[#284237]">
                {content.planning_title}
              </h3>
              <p className="mt-4 text-base leading-7 text-ink/68">
                {content.planning_body}
              </p>
            </Card>

            {content.contact_cards.map((item, index) => {
              const Icon = icons[index] ?? Clock3;
              return (
              <Card key={item.label} className="rounded-[30px] p-6">
                <Icon className="h-6 w-6 text-[#4f684d]" />
                <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                  {item.label}
                </p>
                <p className="mt-2 text-base leading-7 text-ink/68">{item.value}</p>
              </Card>
              );
            })}
          </div>

          <QuoteForm content={content.quote_form} />
        </div>
      </SectionShell>
    </div>
  );
}
