import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, MapPin, Sparkles } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { withCurrentTenant } from "@/lib/tenant";
import type { AboutFeatureCard } from "@/lib/types/site-content";
import { SiteContentService } from "@/services/site-content-service";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet The Social Spread Cart, a Bentonville cart brand serving NWA with charcuterie, dirty soda, bartending, and ice cream toppings bar service.",
};

const iconMap = {
  "heart-handshake": HeartHandshake,
  sparkles: Sparkles,
  "map-pin": MapPin,
} satisfies Record<AboutFeatureCard["icon_key"], typeof HeartHandshake>;

export default async function AboutPage() {
  const { content, images, featureCards } = await withCurrentTenant(
    SiteContentService.loadAboutPageContent,
  );

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-8 sm:p-10">
              <Badge className="border-[#d4ddcb] bg-white text-[#5c7058]">
                {content.story_badge}
              </Badge>
              <p className="mt-6 font-heading text-4xl leading-tight text-[#284237]">
                {content.story_title}
              </p>
              <div className="mt-6 space-y-5 text-base leading-8 text-ink/68">
                {content.story_body.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 18)}`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>
          </Reveal>

          {images.length > 0 ? (
            <Reveal delay={0.08}>
              <div className="grid gap-5 sm:grid-cols-2">
                {images.map((item) => (
                  <div
                    key={item.id}
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
            </Reveal>
          ) : null}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {featureCards.map((item) => {
            const Icon = iconMap[item.icon_key];
            return (
              <Card key={item.display_order} className="rounded-[30px] p-6">
                <Icon className="h-7 w-7 text-[#4f684d]" />
                <h3 className="mt-4 font-heading text-3xl text-[#284237]">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-ink/66">
                  {item.body}
                </p>
              </Card>
            );
          })}
        </div>
      </SectionShell>
    </div>
  );
}
