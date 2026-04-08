import type { Metadata } from "next";

import { MenuBrowser } from "@/components/sections/menu-browser";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
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
          title="Current pickup offerings for hosts who want something easy, polished, and ready to go."
          description="The menu currently features large charcuterie boxes, charcuterie cups, and dirty soda 4-packs. Most orders require 24 to 48 hours&apos; notice, while cart bookings may require additional lead time."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-heading text-3xl text-sage">Pickup</h3>
            <p className="mt-3 text-base leading-7 text-ink/68">
              Ideal for hosts who want ready-to-enjoy snacks, drinks, and shareables with a simple handoff.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="font-heading text-3xl text-sage">Delivery</h3>
            <p className="mt-3 text-base leading-7 text-ink/68">
              Available in Bentonville and surrounding areas, with timing coordinated for event-day ease and private cart bookings.
            </p>
          </Card>
        </div>
        <MenuBrowser items={items} />
      </SectionShell>
    </div>
  );
}
