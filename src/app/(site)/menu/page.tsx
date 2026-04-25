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
  title: "Menu",
  description:
    "Browse charcuterie boxes, charcuterie cups, and dirty soda to-go from The Social Spread Cart in Bentonville.",
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
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-7">
            <Badge className="border-[#d4ddcb] bg-white text-[#5c7058]">
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
            <Card key={item.title} className="rounded-[30px] p-6">
              <Icon className="h-7 w-7 text-[#4f684d]" />
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
