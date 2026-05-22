import type { Metadata } from "next";
import { Clock3, PackageCheck, Truck } from "lucide-react";

import { MenuBrowser } from "@/components/sections/menu-browser";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMenuItems } from "@/lib/data";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata: Metadata = {
  title: "Charcuterie & Dirty Soda Menu in Bentonville",
  description:
    "Browse charcuterie boxes, charcuterie cups, and dirty soda to-go from The Social Spread Cart in Bentonville.",
  alternates: {
    canonical: "/menu",
  },
};

export default async function MenuPage() {
  const [items, pageContent] = await Promise.all([
    getMenuItems(),
    withCurrentTenant((tenantId) =>
      SiteContentService.getMarketingPageContent(tenantId, "menu"),
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

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <Card className="rounded-[34px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-7 shadow-[0_28px_70px_rgba(56,66,44,0.22)] backdrop-blur-xl">
            <Badge className="border-white/60 bg-[#f8f1e3]/90 text-[#5c7058]">
              {content.intro_badge}
            </Badge>
            <p className="mt-5 font-heading text-4xl leading-tight text-[#284237]">
              {content.intro_title}
            </p>
            <p className="mt-4 text-base leading-7 text-ink/68">
              {content.intro_body}
            </p>
          </Card>

          {content.cards.map((item, index) => {
            const Icon = [PackageCheck, Truck, Clock3][index] ?? PackageCheck;
            return (
            <Card key={item.title} className="rounded-[34px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-6 shadow-[0_28px_70px_rgba(56,66,44,0.22)] backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[#eef4e9]/85 text-[#4f684d] shadow-[0_10px_24px_rgba(56,66,44,0.14)] backdrop-blur">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-3xl text-[#284237]">{item.title}</h3>
              <p className="mt-3 text-base leading-7 text-ink/66">{item.body}</p>
            </Card>
            );
          })}
        </div>

        <MenuBrowser items={items} />
      </SectionShell>
    </div>
  );
}
