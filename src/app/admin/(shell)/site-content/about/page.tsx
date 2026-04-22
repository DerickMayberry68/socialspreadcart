import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AboutManager } from "@/components/admin/site-content/about-manager";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata = {
  title: "About Content",
};

export default async function AdminAboutContentPage() {
  const content = await withCurrentTenant(
    SiteContentService.loadAboutPageContent,
  );

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
          About content
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Edit the story, imagery, and value cards guests see on the public
          About page.
        </p>
      </div>

      <AboutManager initial={content} />
    </div>
  );
}
