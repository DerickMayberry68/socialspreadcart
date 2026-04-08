import type { Metadata } from "next";

import { MenuBrowser } from "@/components/sections/menu-browser";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { getMenuItems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Boards Menu",
  description:
    "Browse charcuterie boards from The Social Spread Cart, with pickup, delivery, and event-ready options in Bentonville.",
};

export default async function MenuPage() {
  const items = await getMenuItems();

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Boards Menu"
          title="Pickup and delivery boards with thoughtful styling and flexible sizing."
          description="Our boards are available for local pickup and delivery. Most boards require 48 to 72 hours' notice, while larger event orders may require additional lead time."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-heading text-3xl text-sage">Pickup</h3>
            <p className="mt-3 text-base leading-7 text-ink/68">
              Ideal for hosts who want a ready-to-serve presentation with a simple handoff.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-heading text-3xl text-sage">Delivery</h3>
            <p className="mt-3 text-base leading-7 text-ink/68">
              Available in Bentonville and surrounding areas, with timing coordinated for event-day ease.
            </p>
          </Card>
        </div>
        <MenuBrowser items={items} />
      </SectionShell>
    </div>
  );
}
