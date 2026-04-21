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
import { cartHighlights } from "@/lib/fallback-data";
import { clientMedia, foodMedia } from "@/lib/media";
import type { EventItem, GalleryItem, MenuItem, Testimonial } from "@/lib/types";
import { formatEventDate, formatPrice } from "@/lib/utils";

const proofStats = [
  { label: "Pickup Favorites", value: "48 hr", note: "for most best sellers" },
  { label: "Guest-Friendly", value: "Dietary", note: "clear notes on popular items" },
  { label: "Serving", value: "NWA", note: "Bentonville and nearby communities" },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: "Elegant enough to trust",
    copy:
      "Clear lead times, polished presentation, and straightforward booking details make the experience feel reassuring from the first scroll.",
  },
  {
    icon: Sparkles,
    title: "Joyful enough to share",
    copy:
      "Colorful drinks, generous grazing, and cheerful photography bring a bright premium energy without losing calm.",
  },
  {
    icon: HeartHandshake,
    title: "Flexible enough for real hosting",
    copy:
      "Pickup, delivery, and full cart service let customers find the right level of support for showers, launches, school events, and parties.",
  },
];

const pathways = [
  {
    title: "Pickup for gifting and easy hosting",
    copy:
      "Order polished boxes, charcuterie cups, and bundles when you want something special without full-service catering.",
    image: foodMedia.charcuterieBox,
    accent: "from-[#f5e7d4] to-[#fff7ef]",
    badge: "Fastest path",
  },
  {
    title: "Cart service that becomes part of the decor",
    copy:
      "A styled setup for showers, weddings, community activations, school events, and private gatherings that deserve a focal point.",
    image: clientMedia.cartUmbrellaWide,
    accent: "from-[#dfe8d7] to-[#f5faf1]",
    badge: "Event favorite",
  },
  {
    title: "Pop-ups worth planning around",
    copy:
      "Keep an eye on public events for signature sips, grab-and-go bites, and seasonal specials around Northwest Arkansas.",
    image: clientMedia.cartDirtySodaHero,
    accent: "from-[#f7d7ca] to-[#fff1eb]",
    badge: "Community favorite",
  },
];

const bookingSteps = [
  "Choose pickup, delivery, or a full cart service experience.",
  "Select the menu mix that fits your guest count and the feel of the event.",
  "We confirm timing, setup, and presentation so hosting feels lighter.",
];

const colorBands = [
  "from-[#f4e5d3] to-[#f7f1e7]",
  "from-[#dfe8d8] to-[#eef4ea]",
  "from-[#f7d8c8] to-[#fcece4]",
];

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
  const featuredItems = menuItems.filter((item) => item.featured);
  const featured = (featuredItems.length > 0 ? featuredItems : menuItems).slice(0, 3);
  const storyGallery = gallery.slice(0, 4);
  const proofQuote = testimonials[0];

  return (
    <div className="pb-16">
      <section className="site-aura relative overflow-hidden border-b border-sage/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(90deg,rgba(223,232,216,0.85),rgba(247,216,200,0.4),rgba(244,229,211,0.92))]" />
        <SectionShell className="relative grid gap-14 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20">
          <Reveal>
            <Badge className="border-[#d4ddcb] bg-white/80 text-[#5c7058]">
              Premium cart hospitality in Northwest Arkansas
            </Badge>
            <p className="mt-7 text-sm uppercase tracking-[0.32em] text-ink/55">
              Charcuterie boxes - dirty soda - styled cart service
            </p>
            <h1 className="mt-5 max-w-4xl font-heading text-[3.2rem] leading-[0.92] text-[#284237] sm:text-[4.4rem] lg:text-[5.25rem]">
              A happier way to host snacks, sips, and standout moments.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72 sm:text-xl">
              The Social Spread Cart pairs polished presentation with playful energy so
              showers, markets, launches, and celebrations feel warm, effortless, and fun.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-ink/62">
              Think trust-building details up front, colorful favorites on the table, and
              a booking flow that stays calm from first inquiry to event-day setup.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Start Your Order
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/menu">Browse the Menu</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {proofStats.map((item) => (
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
                <div className="flex items-center gap-2 text-[#d58f63]">
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
            <div className="absolute -left-8 top-10 hidden h-40 w-40 rounded-full bg-[#f6d3c7]/70 blur-3xl sm:block" />
            <div className="absolute -right-6 bottom-10 hidden h-44 w-44 rounded-full bg-[#dde7d7]/80 blur-3xl sm:block" />
            <div className="relative rounded-[40px] border border-white/70 bg-white/70 p-4 shadow-[0_30px_90px_rgba(72,81,61,0.14)] backdrop-blur">
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative overflow-hidden rounded-[30px] bg-[#f6efe3]">
                  <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between rounded-full bg-white/88 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#51654f] shadow-soft backdrop-blur">
                    <span>Host favorite</span>
                    <span>Bentonville, AR</span>
                  </div>
                  <Image
                    src={clientMedia.cartDirtySodaHero}
                    alt="Dirty soda service from The Social Spread Cart"
                    width={900}
                    height={1100}
                    priority
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fff8f1_0%,#f9ecdc_100%)] p-4">
                    <Image
                      src={foodMedia.charcuterieBox}
                      alt="Charcuterie box"
                      width={720}
                      height={640}
                      className="aspect-[4/3] w-full rounded-[22px] object-cover"
                    />
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">
                        Best seller
                      </p>
                      <p className="mt-2 font-heading text-3xl text-[#284237]">
                        Grazing that feels elevated, abundant, and easy.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="rounded-[28px] bg-[linear-gradient(180deg,#eef4e9_0%,#dde9d9_100%)] p-5">
                      <Truck className="h-8 w-8 text-[#4f684d]" />
                      <p className="mt-4 font-heading text-2xl text-[#284237]">
                        Pickup, delivery, or full event setup
                      </p>
                    </div>
                    <div className="rounded-[28px] bg-[linear-gradient(180deg,#fff0e9_0%,#f8ddd1_100%)] p-5">
                      <Store className="h-8 w-8 text-[#a15e50]" />
                      <p className="mt-4 font-heading text-2xl text-[#284237]">
                        Colorful cart moments guests remember
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
          {pillars.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <Card className="h-full rounded-[30px] bg-white/78 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4e9] text-[#4f684d]">
                  <item.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-heading text-[2rem] leading-tight text-[#284237]">
                  {item.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-ink/66">{item.copy}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="mt-24">
        <SectionHeading
          eyebrow="Signature Favorites"
          title="Merchandised like a treat, explained like a service you can trust."
          description="The menu stays intentionally focused: crowd-pleasing charcuterie, colorful drinks, and guest-friendly add-ons that feel special without becoming complicated."
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
                <p className="text-xs uppercase tracking-[0.3em] text-[#ad7a54]">
                  Why this works
                </p>
                <h3 className="mt-3 font-heading text-[2.3rem] leading-tight text-[#284237]">
                  Clear choices, real imagery, and guest-ready expectations.
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  "Real-event photography shows the feeling instead of relying on generic catering tropes.",
                  "Lead times and dietary notes appear early, which lowers hesitation.",
                  "Pickup favorites and event service sit side by side so shoppers can self-sort quickly.",
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
                <Link href="/menu">See the Full Menu</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </SectionShell>

      <section className="mt-24 bg-[linear-gradient(180deg,#f3ebdf_0%,#f8f2e7_100%)] py-20">
        <SectionShell>
          <SectionHeading
            eyebrow="How People Shop Us"
            title="One brand, several easy ways to say yes."
            description="The site now guides customers naturally whether they need a small pickup order, a styled cart service, or a reason to visit a pop-up."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {pathways.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.08}>
                <div className={`h-full overflow-hidden rounded-[34px] bg-gradient-to-br ${item.accent} p-4 shadow-soft`}>
                  <div className="overflow-hidden rounded-[26px] bg-white/80">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={820}
                      height={940}
                      className="aspect-[4/4.4] h-full w-full object-cover"
                    />
                  </div>
                  <div className="px-2 pb-2 pt-5">
                    <Badge className="border-white/60 bg-white/70 text-[#5a6d57]">
                      {item.badge}
                    </Badge>
                    <h3 className="mt-4 font-heading text-[2rem] leading-tight text-[#284237]">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-ink/68">{item.copy}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </SectionShell>
      </section>

      <SectionShell className="mt-24 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <SectionHeading
            eyebrow="The Booking Feeling"
            title="Calm enough for planners, colorful enough for guests."
            description="Borrowing from wellness brands, the experience reduces stress through simple offers, straightforward steps, and copy that answers the question before it becomes friction."
          />
          <div className="mt-8 space-y-4">
            {bookingSteps.map((item, index) => (
              <div
                key={item}
                className="rounded-[28px] border border-sage/10 bg-white/80 px-5 py-5 shadow-soft"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-[#ad7a54]">
                  Step {index + 1}
                </p>
                <p className="mt-3 text-base leading-7 text-ink/68">{item}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[32px] p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4e9] text-[#4f684d]">
                <Clock3 className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-[2rem] leading-tight text-[#284237]">
                Transparent lead times
              </h3>
              <p className="mt-4 text-base leading-7 text-ink/66">
                Premium brands feel more trustworthy when timing expectations are visible instead of hidden behind vague inquiry language.
              </p>
            </Card>
            <Card className="rounded-[32px] p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e9] text-[#a15e50]">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-[2rem] leading-tight text-[#284237]">
                Local and event-ready
              </h3>
              <p className="mt-4 text-base leading-7 text-ink/66">
                Location cues, event imagery, and clear service formats make the brand feel rooted, real, and easy to picture in a host&apos;s day.
              </p>
            </Card>
            <Card className="rounded-[32px] p-7 md:col-span-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5e7d4] text-[#a87955]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-[2.2rem] leading-tight text-[#284237]">
                Editorial enough to feel premium without losing approachability.
              </h3>
              <p className="mt-4 max-w-3xl text-base leading-7 text-ink/66">
                More white space, stronger trust framing, and brighter merchandising make the site feel upscale while still playful and easy to shop.
              </p>
            </Card>
          </div>
        </Reveal>
      </SectionShell>

      <SectionShell className="mt-24 grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Cart Experience"
            title="A mobile cart that feels like part hospitality, part atmosphere."
            description="This is where the playful energy shows up most: curated menus, upbeat color, and a setup that gives events an instant focal point."
          />
          <ul className="mt-8 space-y-4">
            {cartHighlights.map((item) => (
              <li
                key={item}
                className="rounded-[26px] border border-sage/10 bg-white/80 px-5 py-4 text-base leading-7 text-ink/68 shadow-soft"
              >
                {item}
              </li>
            ))}
          </ul>
          <Button className="mt-8" asChild>
            <Link href="/cart-service">Explore Cart Service</Link>
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
                  <p className="text-xs uppercase tracking-[0.26em] text-[#ad7a54]">
                    {item.eyebrow}
                  </p>
                  <p className="mt-2 font-heading text-2xl text-[#284237]">{item.title}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <section className="mt-24 bg-[linear-gradient(180deg,#f8f1e7_0%,#f3ebdf_100%)] py-20">
        <SectionShell className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr]">
          <Reveal>
            <SectionHeading
              eyebrow="Upcoming Pop-Ups"
              title="Public events stay easy to scan and easy to remember."
              description="A cleaner event rhythm keeps the brand feeling alive between private bookings and gives returning customers a reason to check back."
            />
            <Button className="mt-8" variant="outline" asChild>
              <Link href="/events">View Events Calendar</Link>
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
                      <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">
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
          eyebrow="Kind Words"
          title="The trust section should feel as polished as the product."
          description="Testimonials work harder when the layout gives them space, warmth, and a little ceremony."
          align="center"
        />
        <div className="mx-auto mt-10 max-w-4xl">
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </SectionShell>

      <SectionShell className="mt-24">
        <div className="overflow-hidden rounded-[40px] border border-sage/10 bg-[linear-gradient(135deg,#284237_0%,#365649_45%,#4f684d_100%)] px-6 py-12 text-[#f7f2ea] shadow-[0_30px_90px_rgba(40,66,55,0.22)] sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[#d9e6d6]">
                Ready to book?
              </p>
              <h2 className="mt-4 max-w-3xl font-heading text-5xl leading-[0.94]">
                Build a menu that feels trustworthy, celebratory, and easy to say yes to.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#edf2ec]/82">
                Whether you need a polished pickup order or a cart that becomes part of the event, the next step is simple.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Button size="lg" variant="gold" asChild>
                <Link href="/contact">Book the Cart</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/16"
                asChild
              >
                <Link href="/menu">See Menu Options</Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
