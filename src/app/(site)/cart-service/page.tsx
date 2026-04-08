import type { Metadata } from "next";
import Image from "next/image";

import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cartHighlights } from "@/lib/fallback-data";
import { cartGallery } from "@/lib/media";

export const metadata: Metadata = {
  title: "The Cart Service",
  description:
    "Learn about The Social Spread Cart's mobile snack and beverage cart service for private events, pop-ups, and community gatherings.",
};

export default function CartServicePage() {
  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="The Cart Service"
          title="A mobile snack and beverage cart designed to be both the service and the scene."
          description="The cart is perfect for showers, school events, birthdays, open houses, launch events, markets, and corporate socials where the menu should feel fun and memorable."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {cartGallery.map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft"
                >
                  <Image
                    src={item}
                    alt="The Social Spread Cart cart item"
                    width={700}
                    height={875}
                    className="h-full w-full object-cover"
                  />
                </div>
            ))}
          </div>
          <Card className="p-8 sm:p-10">
            <h3 className="font-heading text-4xl text-sage">What&apos;s included</h3>
            <ul className="mt-6 space-y-4 text-base leading-7 text-ink/68">
              {cartHighlights.map((item) => (
                <li key={item} className="rounded-[24px] bg-sage-50 px-5 py-4">
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Dirty soda service",
                "Mini pancake service",
                "Charcuterie options",
                "Pop-up ready service",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-sage/10 bg-white px-4 py-4 text-sm uppercase tracking-[0.18em] text-sage"
                >
                  {item}
                </div>
              ))}
            </div>
            <Button className="mt-8" asChild>
              <a href="/contact#quote-form">Get a Quote</a>
            </Button>
          </Card>
        </div>
      </SectionShell>
    </div>
  );
}
