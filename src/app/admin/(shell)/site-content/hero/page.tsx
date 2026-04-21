import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { HeroForm } from "@/components/admin/site-content/hero-form";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata = {
  title: "Hero Content",
};

export default async function AdminHeroPage() {
  const hero = await withCurrentTenant(SiteContentService.getHeroContent);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/site-content"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/50 transition hover:text-sage"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Site content
        </Link>
        <h1 className="mt-3 font-heading text-4xl text-[#284237]">
          Hero content
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Edit the headline, sub-line, body copy, and primary/secondary CTAs
          that appear above the fold on the home page.
        </p>
      </div>

      <HeroForm initial={hero} />
    </div>
  );
}
