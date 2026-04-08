import type { Metadata } from "next";
import Image from "next/image";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet The Social Spread Cart, a Bentonville catering business focused on refined charcuterie and elegant mobile service.",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="About Us"
          title="The Social Spread Cart pairs gracious hosting with a polished, editorial look."
          description="Built for celebrations that deserve both visual beauty and genuinely good food, our approach blends Southern hospitality with a modern luxury feel."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Card className="p-8 sm:p-10">
              <p className="font-heading text-4xl text-sage">
                Thoughtful presentation, warm hospitality, and flexible event service.
              </p>
              <div className="mt-6 space-y-5 text-base leading-8 text-ink/68">
                <p>
                  The Social Spread Cart was created for hosts who want something
                  more memorable than standard catering. Every board and event
                  setup is styled to feel intentional, abundant, and effortless.
                </p>
                <p>
                  From intimate celebrations to larger guest counts, our menus
                  are shaped around seasonal ingredients, clean presentation, and
                  a calm service experience.
                </p>
                <p>
                  We serve Bentonville and nearby Arkansas communities with
                  pickup boards, local delivery, and on-site cart experiences.
                </p>
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-5 sm:grid-cols-2">
              {["template-10.svg", "template-9.svg", "template-8.svg", "template-2.svg"].map(
                (item) => (
                  <div key={item} className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft">
                    <Image
                      src={`/brand/templates/${item}`}
                      alt=""
                      width={700}
                      height={875}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ),
              )}
            </div>
          </Reveal>
        </div>
      </SectionShell>
    </div>
  );
}
