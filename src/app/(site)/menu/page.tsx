import type { Metadata } from "next";
import { Clock3, PackageCheck, Truck } from "lucide-react";

import { MenuBrowser } from "@/components/sections/menu-browser";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMenuItems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse charcuterie boxes, charcuterie cups, and dirty soda to-go from The Social Spread Cart in Bentonville.",
};

export default async function MenuPage() {
  const items = await getMenuItems();

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Menu"
          title="Current pickup offerings for hosts who want something polished, colorful, and easy to order."
          description="The menu focuses on a few high-confidence favorites so the experience feels curated rather than crowded."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-7">
            <Badge className="border-[#d4ddcb] bg-white text-[#5c7058]">Designed for quick decisions</Badge>
            <p className="mt-5 font-heading text-4xl leading-tight text-[#284237]">
              The best version of the menu feels edited, not endless.
            </p>
            <p className="mt-4 text-base leading-7 text-ink/68">
              Most orders require 24 to 48 hours of notice, and the best sellers are
              built to travel well, photograph beautifully, and make hosting feel easier.
            </p>
          </Card>

          {[
            {
              icon: PackageCheck,
              title: "Pickup",
              copy: "Ideal for hosts who want ready-to-enjoy snacks, drinks, and shareables with a simple handoff.",
            },
            {
              icon: Truck,
              title: "Delivery",
              copy: "Available in Bentonville and surrounding areas, with timing coordinated for event-day ease.",
            },
            {
              icon: Clock3,
              title: "Lead Times",
              copy: "Cart bookings and larger event orders may require additional planning time beyond standard menu favorites.",
            },
          ].map((item) => (
            <Card key={item.title} className="rounded-[30px] p-6">
              <item.icon className="h-7 w-7 text-[#4f684d]" />
              <h3 className="mt-4 font-heading text-3xl text-[#284237]">{item.title}</h3>
              <p className="mt-3 text-base leading-7 text-ink/66">{item.copy}</p>
            </Card>
          ))}
        </div>

        <MenuBrowser items={items} />
      </SectionShell>
    </div>
  );
}
