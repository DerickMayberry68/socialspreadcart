import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  Images,
  LayoutGrid,
  Sparkles,
  Type,
} from "lucide-react";

export const metadata = {
  title: "Site Content",
};

const cards = [
  {
    href: "/admin/site-content/configuration",
    icon: Sparkles,
    eyebrow: "Sitewide",
    title: "Site configuration",
    description:
      "Brand name, tagline, primary booking call-to-action, and support contact info shown in the header, footer, and across pages.",
  },
  {
    href: "/admin/site-content/hero",
    icon: Type,
    eyebrow: "Home page",
    title: "Hero content",
    description:
      "The headline, sub-line, body copy, and CTAs that appear above the fold on the public home page.",
  },
  {
    href: "/admin/site-content/pathway-cards",
    icon: LayoutGrid,
    eyebrow: "Home page",
    title: "Pathway cards",
    description:
      "The three feature cards below the hero that guide visitors into pickup, cart service, or upcoming events.",
  },
  {
    href: "/admin/site-content/gallery",
    icon: Images,
    eyebrow: "Gallery page",
    title: "Gallery content",
    description:
      "The public gallery copy and photos guests use to picture the cart, drinks, food, and event setup.",
  },
  {
    href: "/admin/site-content/about",
    icon: HeartHandshake,
    eyebrow: "About page",
    title: "About content",
    description:
      "The public About page story, supporting photos, and three value cards that introduce the brand.",
  },
] as const;

export default function AdminSiteContentIndex() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">
          Site content
        </p>
        <h1 className="mt-3 font-heading text-4xl text-[#284237]">
          Every word guests see on the public site.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Update your brand, hero, and pathway cards without a developer
          deploy. Saves publish immediately and the public page refreshes on
          the next visit.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ href, icon: Icon, eyebrow, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-sage/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4e9] text-[#4f684d]">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
              {eyebrow}
            </p>
            <h2 className="mt-2 font-heading text-2xl text-[#284237]">
              {title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-ink/62">
              {description}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-sage">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
