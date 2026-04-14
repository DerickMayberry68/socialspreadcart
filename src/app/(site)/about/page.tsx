import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, MapPin, Sparkles } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cartGallery } from "@/lib/media";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet The Social Spread Cart, a Bentonville cart brand serving NWA with charcuterie, dirty soda, bartending, and ice cream toppings bar service.",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="About The Brand"
          title="A hospitality brand built to feel polished, cheerful, and easy to welcome into the room."
          description="The Social Spread Cart exists for hosts who want the event to feel thoughtful and memorable without adding more stress to the planning process."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-8 sm:p-10">
              <Badge className="border-[#d4ddcb] bg-white text-[#5c7058]">
                Bentonville based
              </Badge>
              <p className="mt-6 font-heading text-4xl leading-tight text-[#284237]">
                Thoughtful presentation, warm hospitality, and a little bit of delight in every setup.
              </p>
              <div className="mt-6 space-y-5 text-base leading-8 text-ink/68">
                <p>
                  The Social Spread Cart was created for hosts who want something more
                  memorable than standard catering. Every menu and cart setup is designed
                  to feel intentional, approachable, and easy to enjoy.
                </p>
                <p>
                  From take-home orders to full event setups, the current offer centers on
                  large charcuterie boxes, charcuterie cups, dirty soda, and a small set
                  of cart services including a mini pancake bar, bartending, and event-ready
                  station setups.
                </p>
                <p>
                  We serve Bentonville and nearby Northwest Arkansas communities with pickup
                  items, local delivery, and on-site cart experiences.
                </p>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="grid gap-5 sm:grid-cols-2">
              {cartGallery.map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft"
                >
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

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: "Approachable service",
              copy: "The experience should feel easy for the host and welcoming for every guest.",
            },
            {
              icon: Sparkles,
              title: "Playful polish",
              copy: "The brand mixes premium presentation with bright, celebratory energy.",
            },
            {
              icon: MapPin,
              title: "Locally rooted",
              copy: "Built for Bentonville and the wider Northwest Arkansas event scene.",
            },
          ].map((item) => (
            <Card key={item.title} className="rounded-[30px] p-6">
              <item.icon className="h-7 w-7 text-[#4f684d]" />
              <h3 className="mt-4 font-heading text-3xl text-[#284237]">{item.title}</h3>
              <p className="mt-3 text-base leading-7 text-ink/66">{item.copy}</p>
            </Card>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
