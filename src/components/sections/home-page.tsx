import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";

import { TestimonialCarousel } from "@/components/sections/testimonial-carousel";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_HOME_MARKETING_CONTENT } from "@/lib/page-content-defaults";
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_PATHWAY_CARDS,
  DEFAULT_SITE_CONFIGURATION,
} from "@/lib/site";
import type { EventItem, GalleryItem, MenuItem, Testimonial } from "@/lib/types";
import type {
  HomePageContent,
  HomePageMarketingContent,
} from "@/lib/types/site-content";
import { formatEventDate, formatPrice } from "@/lib/utils";

const pathwayAccents = [
  "from-[#e8c9a6] to-[#fcf3e0]",
  "from-[#d6e0cb] to-[#f3f7ec]",
  "from-[#e8b896] to-[#fef0e0]",
] as const;

const colorBands = [
  "from-[#e5d6b8] to-[#fbf3e1]",
  "from-[#dfe8d8] to-[#eef4ea]",
  "from-[#e8c1a0] to-[#fcf0e4]",
];

const pillarIcons = [ShieldCheck, Sparkles, HeartHandshake] as const;
const bookingCardIcons = [Clock3, MapPin, Sparkles] as const;

export function HomePage({
  menuItems,
  events,
  testimonials,
  gallery,
  content,
  marketingContent,
}: {
  menuItems: MenuItem[];
  events: EventItem[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
  content?: HomePageContent;
  marketingContent?: HomePageMarketingContent;
}) {
  const featuredItems = menuItems.filter((item) => item.featured);
  const featured = (featuredItems.length > 0 ? featuredItems : menuItems).slice(0, 3);
  const storyGallery = gallery.slice(0, 4);
  const proofQuote = testimonials[0];

  const hero = content?.hero ?? DEFAULT_HERO_CONTENT;
  const siteConfig = content?.siteConfig ?? DEFAULT_SITE_CONFIGURATION;
  const pathwayCards = content?.pathwayCards ?? DEFAULT_PATHWAY_CARDS;
  const marketing = marketingContent ?? DEFAULT_HOME_MARKETING_CONTENT;

  const heroPrimaryLabel = hero.primary_cta_label.trim();
  const heroPrimaryTarget = hero.primary_cta_target.trim();
  const heroSecondaryLabel = hero.secondary_cta_label.trim();
  const heroSecondaryTarget = hero.secondary_cta_target.trim();

  return (
    <div className="pb-16">
      <section className="site-aura relative overflow-hidden border-b border-sage/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(90deg,rgba(223,232,216,0.85),rgba(247,216,200,0.4),rgba(244,229,211,0.92))]" />
        <SectionShell className="relative grid gap-14 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
          <Reveal>
            <Badge className="border-[#d4ddcb] bg-white/80 text-[#5c7058]">
              {marketing.hero_badge}
            </Badge>
            <p className="mt-7 text-sm uppercase tracking-[0.32em] text-ink/55">
              {marketing.hero_kicker}
            </p>
            <h1 className="mt-5 max-w-4xl font-heading text-[3rem] leading-[0.95] text-[#284237] sm:text-[4rem] lg:text-[4.75rem]">
              {hero.headline}
              {hero.sub_line ? (
                <span className="block text-[2.25rem] leading-tight text-[#8c5a36] sm:text-[3rem] lg:text-[3.5rem]">
                  {hero.sub_line}
                </span>
              ) : null}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72 sm:text-xl">
              {hero.body}
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              {heroPrimaryLabel && heroPrimaryTarget ? (
                <Button size="lg" asChild>
                  <Link href={heroPrimaryTarget}>
                    {heroPrimaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {heroSecondaryLabel && heroSecondaryTarget ? (
                <Button size="lg" variant="outline" asChild>
                  <Link href={heroSecondaryTarget}>{heroSecondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {marketing.proof_stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-white/70 bg-white/75 px-5 py-5 shadow-soft backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ink/50">
                    {item.label}
                  </p>
                  <p className="mt-3 font-heading text-4xl text-[#284237]">{item.value}</p>
                  <p className="mt-1 text-sm text-ink/58">{item.note}</p>
                </div>
              ))}
            </div>
            {proofQuote ? (
              <div className="mt-8 max-w-2xl rounded-[30px] border border-[#dfd7c5] bg-[#fffaf3] px-6 py-5 shadow-soft">
                <div className="flex items-center gap-2 text-[#b8562e]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Sparkles key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-lg leading-8 text-ink/72">
                  &ldquo;{proofQuote.quote}&rdquo;
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.26em] text-ink/50">
                  {proofQuote.name} - {proofQuote.occasion}
                </p>
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={0.08} className="relative">
            <div className="absolute -left-8 top-10 hidden h-40 w-40 rounded-full bg-[#f0c4a2]/70 blur-3xl sm:block" />
            <div className="absolute -right-6 bottom-10 hidden h-44 w-44 rounded-full bg-[#dde7d7]/80 blur-3xl sm:block" />
            <div className="relative rounded-[40px] border border-white/70 bg-white/70 p-4 shadow-[0_30px_90px_rgba(72,81,61,0.14)] backdrop-blur">
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative overflow-hidden rounded-[30px] bg-[#f6efe3]">
                  <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between rounded-full bg-white/88 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#51654f] shadow-soft backdrop-blur">
                    <span>{marketing.hero_main_image_left_label}</span>
                    <span>{marketing.hero_main_image_right_label}</span>
                  </div>
                  <Image
                    src={marketing.hero_main_image.image_url}
                    alt={marketing.hero_main_image.alt_text}
                    width={900}
                    height={1100}
                    priority
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fdf5e6_0%,#f3e6ca_100%)] p-4">
                    <Image
                      src={marketing.hero_feature_image.image_url}
                      alt={marketing.hero_feature_image.alt_text}
                      width={720}
                      height={640}
                      className="aspect-[4/3] w-full rounded-[22px] object-cover"
                    />
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#8c5a36]">
                        {marketing.hero_feature_eyebrow}
                      </p>
                      <p className="mt-2 font-heading text-3xl text-[#284237]">
                        {marketing.hero_feature_title}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-[28px] bg-[linear-gradient(180deg,#eef4e9_0%,#dde9d9_100%)] p-5">
                      <Truck className="h-8 w-8 text-[#4f684d]" />
                      <p className="mt-4 font-heading text-2xl text-[#284237]">
                        {marketing.hero_service_cards[0]}
                      </p>
                    </div>
                    <div className="rounded-[28px] bg-[linear-gradient(180deg,#fce1d2_0%,#f2c4a5_100%)] p-5">
                      <Store className="h-8 w-8 text-[#b8562e]" />
                      <p className="mt-4 font-heading text-2xl text-[#284237]">
                        {marketing.hero_service_cards[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </SectionShell>
      </section>

      <SectionShell className="mt-10">
        <div className="grid gap-5 md:grid-cols-3">
          {marketing.pillars.map((item, index) => {
            const Icon = pillarIcons[index] ?? ShieldCheck;
            return (
              <Reveal key={item.title} delay={index * 0.08}>
                <Card className="h-full rounded-[30px] bg-white/78 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4e9] text-[#4f684d]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 font-heading text-[2rem] leading-tight text-[#284237]">
                    {item.title}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-ink/66">
                    {item.body}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell className="mt-24">
        <SectionHeading
          eyebrow={marketing.menu_section.eyebrow}
          title={marketing.menu_section.title}
          description={marketing.menu_section.description}
        />
        <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.08}>
                <div className="group h-full overflow-hidden rounded-[34px] border border-sage/10 bg-white shadow-soft">
                  <div className={`bg-gradient-to-br p-4 ${colorBands[index % colorBands.length]}`}>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-ink/48">
                      <span>{item.size}</span>
                      <span>{formatPrice(item.price_cents)}</span>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[24px]">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={800}
                        height={960}
                        className="aspect-[4/4.8] h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-3xl text-[#284237]">{item.name}</h3>
                    <p className="mt-3 text-base leading-7 text-ink/66">{item.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.dietary.slice(0, 2).map((value) => (
                        <Badge
                          key={value}
                          className="border-[#ddd5c8] bg-[#fffaf4] text-[#5a6d57]"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-4 text-sm text-ink/55">
                      <span>Lead time: {item.lead_time}</span>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 font-medium text-[#284237] transition hover:text-[#4f684d]"
                      >
                        Add to inquiry
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.12}>
            <div className="space-y-6 rounded-[34px] border border-sage/10 bg-[#fffaf4] p-7 shadow-soft">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#8c5a36]">
                  {marketing.menu_section.support_eyebrow}
                </p>
                <h3 className="mt-3 font-heading text-[2.3rem] leading-tight text-[#284237]">
                  {marketing.menu_section.support_title}
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  ...marketing.menu_section.support_points,
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[24px] border border-[#e5dccd] bg-white px-5 py-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5f7657]" />
                    <p className="text-sm leading-7 text-ink/68">{item}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" variant="gold" asChild>
                <Link href={marketing.menu_section.cta_target}>
                  {marketing.menu_section.cta_label}
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </SectionShell>

      <section className="mt-24 bg-[linear-gradient(180deg,#f3e4c3_0%,#faf0db_100%)] py-20">
        <SectionShell>
          <SectionHeading
            eyebrow={marketing.pathway_section.eyebrow}
            title={marketing.pathway_section.title}
            description={marketing.pathway_section.description}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {pathwayCards.map((card, index) => (
              <Reveal key={card.display_order} delay={index * 0.08}>
                <Link
                  href={card.link_target}
                  className={`group block h-full overflow-hidden rounded-[34px] bg-gradient-to-br ${pathwayAccents[index] ?? pathwayAccents[0]} p-4 shadow-soft transition hover:-translate-y-0.5`}
                >
                  <div className="overflow-hidden rounded-[26px] bg-white/80">
                    <Image
                      src={card.image_url}
                      alt={card.title}
                      width={820}
                      height={940}
                      className="aspect-[4/4.4] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="px-2 pb-2 pt-5">
                    {card.badge ? (
                      <Badge className="border-white/60 bg-white/70 text-[#5a6d57]">
                        {card.badge}
                      </Badge>
                    ) : null}
                    <h3 className="mt-4 font-heading text-[2rem] leading-tight text-[#284237]">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-ink/68">
                      {card.body}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </SectionShell>
      </section>

      <SectionShell className="mt-24 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <SectionHeading
            eyebrow={marketing.booking_section.eyebrow}
            title={marketing.booking_section.title}
            description={marketing.booking_section.description}
          />
          <div className="mt-8 space-y-4">
            {marketing.booking_section.steps.map((item, index) => (
              <div
                key={item}
                className="rounded-[28px] border border-sage/10 bg-white/80 px-5 py-5 shadow-soft"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-[#8c5a36]">
                  Step {index + 1}
                </p>
                <p className="mt-3 text-base leading-7 text-ink/68">{item}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="grid gap-6 md:grid-cols-2">
            {marketing.booking_section.cards.map((card, index) => {
              const Icon = bookingCardIcons[index] ?? Sparkles;
              return (
                <Card
                  key={card.title}
                  className={`rounded-[32px] p-7 ${index === 2 ? "md:col-span-2" : ""}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4e9] text-[#4f684d]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-heading text-[2rem] leading-tight text-[#284237]">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-ink/66">
                    {card.body}
                  </p>
                </Card>
              );
            })}
          </div>
        </Reveal>
      </SectionShell>

      <SectionShell className="mt-24 grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <SectionHeading
            eyebrow={marketing.cart_section.eyebrow}
            title={marketing.cart_section.title}
            description={marketing.cart_section.description}
          />
          <ul className="mt-8 space-y-4">
            {marketing.cart_section.highlights.map((item) => (
              <li
                key={item}
                className="rounded-[26px] border border-sage/10 bg-white/80 px-5 py-4 text-base leading-7 text-ink/68 shadow-soft"
              >
                {item}
              </li>
            ))}
          </ul>
          <Button className="mt-8" asChild>
            <Link href={marketing.cart_section.cta_target}>
              {marketing.cart_section.cta_label}
            </Link>
          </Button>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2">
          {storyGallery.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.06}>
              <div className="group overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft">
                <div className="aspect-[4/4.6] overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    width={840}
                    height={980}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.26em] text-[#8c5a36]">
                    {item.eyebrow}
                  </p>
                  <p className="mt-2 font-heading text-2xl text-[#284237]">{item.title}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <section className="mt-24 bg-[linear-gradient(180deg,#faf0db_0%,#f3e4c3_100%)] py-20">
        <SectionShell className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr]">
          <Reveal>
            <SectionHeading
              eyebrow={marketing.events_section.eyebrow}
              title={marketing.events_section.title}
              description={marketing.events_section.description}
            />
            <Button className="mt-8" variant="outline" asChild>
              <Link href={marketing.events_section.cta_target}>
                {marketing.events_section.cta_label}
              </Link>
            </Button>
          </Reveal>
          <div className="space-y-4">
            {events.slice(0, 3).map((event, index) => (
              <Reveal key={event.id} delay={index * 0.08}>
                <div className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-soft">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#284237] text-center text-[#fbf5eb]">
                      <div>
                        <CalendarDays className="mx-auto h-5 w-5" />
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em]">
                          {formatEventDate(event.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#8c5a36]">
                        {event.location}
                      </p>
                      <h3 className="mt-2 font-heading text-3xl text-[#284237]">
                        {event.title}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-ink/66">{event.description}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </SectionShell>
      </section>

      <SectionShell className="mt-24">
        <SectionHeading
          eyebrow={marketing.testimonials_section.eyebrow}
          title={marketing.testimonials_section.title}
          description={marketing.testimonials_section.description}
          align="center"
        />
        <div className="mx-auto mt-10 max-w-4xl">
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </SectionShell>

      <SectionShell className="mt-24">
        <div className="overflow-hidden rounded-[40px] border border-walnut/20 bg-[linear-gradient(135deg,#3c2514_0%,#5a3a22_45%,#8c5a36_100%)] px-6 py-12 text-[#fbf0d6] shadow-[0_30px_90px_rgba(60,37,20,0.3)] sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[#efdfb7]">
                {marketing.final_cta.eyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl font-heading text-5xl leading-[0.94]">
                {marketing.final_cta.title}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f5e9d2]/85">
                {marketing.final_cta.description}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Button size="lg" variant="gold" asChild>
                <Link href={siteConfig.booking_cta_target}>
                  {siteConfig.booking_cta_label}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/16"
                asChild
              >
                <Link href={marketing.final_cta.secondary_cta_target}>
                  {marketing.final_cta.secondary_cta_label}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
