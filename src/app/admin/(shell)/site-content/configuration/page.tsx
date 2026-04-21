import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteConfigurationForm } from "@/components/admin/site-content/site-configuration-form";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata = {
  title: "Site Configuration",
};

export default async function AdminSiteConfigurationPage() {
  const config = await withCurrentTenant(
    SiteContentService.getSiteConfiguration,
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
          Site configuration
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Brand name, tagline, primary booking CTA, and support contact
          details.
        </p>
      </div>

      <SiteConfigurationForm initial={config} />
    </div>
  );
}
