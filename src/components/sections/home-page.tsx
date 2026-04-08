import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CarFront, Sparkles, Store } from "lucide-react";

import { TestimonialCarousel } from "@/components/sections/testimonial-carousel";
import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cartHighlights } from "@/lib/fallback-data";
import { cartGallery, lifestyleGrid } from "@/lib/media";
import type { EventItem, GalleryItem, MenuItem, Testimonial } from "@/lib/types";
import { formatEventDate, formatPrice } from "@/lib/utils";

export function HomePage({
  menuItems,
  events,
  testimonials,
  gallery,
}: {
  menuItems: MenuItem[];
  events: EventItem[];
  testimonials: Testimonial[];
  gallery: GalleryItem[];
}) {
  const featured = menuItems.filter((item) => item.featured).slice(0, 3);

  return (
    <div className="pb-10">
      <section className="hero-glow relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-7 bg-stripe opacity-95" />
        <div className="absolute inset-x-0 bottom-0 h-7 bg-stripe opacity-95" />
        <SectionShell className="relative grid min-h-[calc(100vh-90px)] items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <Badge>NWA • Mobile Snack Cart • Events</Badge>
            <h1 className="mt-6 max-w-3xl font-heading text-5xl leading-[0.95] text-sage sm:text-6xl lg:text-7xl">
              Mobile Snack & Beverage Cart serving NWA 🧀🍬🍇🥂
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72 sm:text-xl">
              Charcuterie, Dirty Soda, Mini Pancakes, and more!
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-ink/68 sm:text-lg">
              The Social Spread Cart brings a playful but polished cart
              experience to Northwest Arkansas with snackable charcuterie,
              dirty soda, mini pancakes, sweet treats, and event-friendly
              service for parties, pop-ups, school functions, and brand events.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/menu">Browse Menu</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact#quote-form">Book the Cart</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 text-sm uppercase tracking-[0.18em] text-ink/60 sm:grid-cols-3">
              <div>Pickup + Delivery</div>
              <div>Pop-ups + Private Events</div>
              <div>Snacks + Sips + Sweets</div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="mx-auto max-w-xl">
            <div className="relative rounded-[36px] border border-sage/15 bg-white/50 p-4 shadow-frame backdrop-blur">
              <div className="absolute -right-6 -top-6 hidden w-32 animate-float sm:block">
                <Logo variant="circle" />
              </div>
              <div className="rounded-[28px] border border-sage/10 bg-cream p-8">
                <Logo variant="rect" priority />
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {lifestyleGrid.map((item) => (
                      <div
                        key={item}
                        className="overflow-hidden rounded-[22px] border border-sage/10 bg-white"
                      >
                        <Image
                          src={item}
                          alt="The Social Spread Cart menu item"
                          width={540}
                          height={675}
                          className="h-full w-full object-cover"
                        />
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </SectionShell>
      </section>

      <SectionShell className="mt-10">
        <Card className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
          {[
            {
              icon: CarFront,
              title: "Pickup + local delivery",
              copy: "Serving Bentonville and nearby communities with polished handoff, delivery, and event-day setup.",
            },
            {
              icon: Store,
              title: "Styled mobile cart service",
              copy: "A photo-ready cart setup for parties, school events, launches, receptions, and community pop-ups.",
            },
            {
              icon: Sparkles,
              title: "Curated to fit the moment",
              copy: "Build a mix of charcuterie, dirty soda, mini pancakes, candy, and seasonal treats around your event.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] bg-white/70 p-5">
              <item.icon className="h-8 w-8 text-sage" />
              <h3 className="mt-4 font-heading text-3xl text-sage">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-ink/68">{item.copy}</p>
            </div>
          ))}
        </Card>
      </SectionShell>

      <SectionShell className="mt-24">
        <SectionHeading
          eyebrow="Featured Menu"
          title="A cart menu built for snacking, sipping, and celebrating."
          description="From charcuterie-forward favorites to sweet bites and drinks, the menu is designed to feel flexible, crowd-pleasing, and event-ready."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featured.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.08}>
              <Card className="h-full overflow-hidden">
                <div className="aspect-[4/4.8] overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={800}
                    height={1000}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-heading text-3xl text-sage">{item.name}</h3>
                    <span className="text-sm uppercase tracking-[0.16em] text-gold">
                      {formatPrice(item.price_cents)}
                    </span>
                  </div>
                  <p className="mt-3 text-base leading-7 text-ink/68">
                    {item.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge>{item.size}</Badge>
                    {item.dietary.slice(0, 2).map((value) => (
                      <Badge key={value} className="bg-white">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <section className="section-frame mt-24 bg-[#f5edda] py-20">
        <SectionShell className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <SectionHeading
              eyebrow="The Cart Experience"
              title="A mobile snack and beverage cart that becomes part of the event."
              description="Perfect for school events, showers, birthdays, brand launches, markets, and private gatherings that need a fun focal point."
            />
            <ul className="mt-8 space-y-4 text-base leading-7 text-ink/70">
              {cartHighlights.map((item) => (
                <li key={item} className="rounded-[24px] bg-white/70 px-5 py-4">
                  {item}
                </li>
              ))}
            </ul>
            <Button className="mt-8" asChild>
              <Link href="/cart-service">Explore Cart Service</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="grid gap-5 sm:grid-cols-2">
              {cartGallery.map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft"
                  >
                    <Image
                      src={item}
                      alt="The Social Spread Cart cart menu"
                      width={540}
                      height={675}
                      className="h-full w-full object-cover"
                    />
                  </div>
              ))}
            </div>
          </Reveal>
        </SectionShell>
      </section>

      <SectionShell className="mt-24 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Upcoming Pop-ups"
            title="Find the cart around NWA and plan ahead for upcoming pop-ups."
            description="We keep public events easy to browse so guests can stop in for snacks, drinks, and seasonal specials."
          />
          <Button className="mt-8" variant="outline" asChild>
            <Link href="/events">View Events Calendar</Link>
          </Button>
        </Reveal>
        <div className="space-y-4">
          {events.slice(0, 3).map((event, index) => (
            <Reveal key={event.id} delay={index * 0.08}>
              <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage text-center text-cream">
                  <div>
                    <CalendarDays className="mx-auto h-5 w-5" />
                    <div className="mt-1 text-[10px] uppercase tracking-[0.18em]">
                      {formatEventDate(event.date)}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">
                    {event.location}
                  </p>
                  <h3 className="mt-2 font-heading text-3xl text-sage">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-ink/68">
                    {event.description}
                  </p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="mt-24">
        <SectionHeading
          eyebrow="Kind Words"
          title="Hospitality that feels effortless for hosts and memorable for guests."
          align="center"
        />
        <div className="mx-auto mt-10 max-w-4xl">
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </SectionShell>

      <SectionShell className="mt-24">
        <SectionHeading
          eyebrow="Gallery"
          title="Instagram-inspired brand moments that carry the same refined mood from screen to event day."
          align="center"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.05}>
              <div className="group overflow-hidden rounded-[28px] border border-sage/10 bg-white shadow-soft">
                <div className="aspect-[4/5] overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    width={800}
                    height={1000}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gold">
                    {item.eyebrow}
                  </p>
                  <p className="mt-2 font-heading text-2xl text-sage">
                    {item.title}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
