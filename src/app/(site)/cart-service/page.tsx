import type { Metadata } from "next";
import Image from "next/image";

import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata: Metadata = {
  title: "The Cart Service",
  description:
    "Learn about The Social Spread Cart's Bentonville cart services for charcuterie, dirty soda, mini pancake bars, bartending, and ice cream toppings bars.",
};

export default async function CartServicePage() {
  const pageContent = await withCurrentTenant((tenantId) =>
    SiteContentService.getMarketingPageContent(tenantId, "cart-service"),
  );
  const content = pageContent.content;

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {content.gallery.map((item) => (
              <div
                key={item.image_url}
                className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft"
              >
                <Image
                  src={item.image_url}
                  alt={item.alt_text}
                  width={700}
                  height={875}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-8 sm:p-10">
            <h3 className="font-heading text-4xl text-[#284237]">
              {content.included_title}
            </h3>
            <ul className="mt-6 space-y-4 text-base leading-7 text-ink/68">
              {content.highlights.map((item) => (
                <li key={item} className="rounded-[24px] bg-white px-5 py-4">
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {content.service_chips.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-sage/10 bg-[linear-gradient(180deg,#fff8f1_0%,#f9ecdc_100%)] px-4 py-4 text-sm uppercase tracking-[0.18em] text-[#284237]"
                >
                  {item}
                </div>
              ))}
            </div>
            <Button className="mt-8" asChild>
              <a href={content.cta_target}>{content.cta_label}</a>
            </Button>
          </Card>
        </div>
      </SectionShell>
    </div>
  );
}
