import type { Metadata } from "next";
import Image from "next/image";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { cartGallery } from "@/lib/media";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet The Social Spread Cart, a Bentonville snack and beverage cart brand serving NWA with charcuterie, dirty soda, mini pancakes, and more.",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="About Us"
          title="The Social Spread Cart brings a polished look to fun, crowd-pleasing snacks and drinks."
          description="Built for events that should feel memorable and easy to enjoy, our approach blends playful menu choices with clean presentation and reliable service."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Card className="p-8 sm:p-10">
              <p className="font-heading text-4xl text-sage">
                Thoughtful presentation, warm hospitality, and flexible event service.
              </p>
              <div className="mt-6 space-y-5 text-base leading-8 text-ink/68">
                <p>
                  The Social Spread Cart was created for hosts who want
                  something more fun and memorable than standard catering. Every
                  menu and cart setup is designed to feel intentional,
                  approachable, and easy to enjoy.
                </p>
                <p>
                  From intimate celebrations to larger guest counts, our menus
                  blend charcuterie, drinks, sweets, and crowd-pleasing snack
                  favorites with clean presentation and a calm service
                  experience.
                </p>
                <p>
                  We serve Bentonville and nearby Northwest Arkansas communities
                  with pickup items, local delivery, and on-site cart
                  experiences.
                </p>
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-5 sm:grid-cols-2">
              {cartGallery.map((item) => (
                  <div key={item} className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft">
                    <Image
                      src={item}
                      alt="The Social Spread Cart menu photography"
                      width={700}
                      height={875}
                      className="h-full w-full object-cover"
                    />
                  </div>
              ))}
            </div>
          </Reveal>
        </div>
      </SectionShell>
    </div>
  );
}
