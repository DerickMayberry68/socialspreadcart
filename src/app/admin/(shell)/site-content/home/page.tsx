import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageContentForm } from "@/components/admin/site-content/page-content-form";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata = {
  title: "Home Page Content",
};

export default async function AdminHomePageContentPage() {
  const record = await withCurrentTenant((tenantId) =>
    SiteContentService.getMarketingPageContent(tenantId, "home"),
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
          Home page content
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Edit the Home page sections not already covered by the Hero and
          Pathway Cards editors.
        </p>
      </div>

      <PageContentForm
        pageKey="home"
        title="Home page sections"
        description="These fields control proof stats, pillars, section headings, service copy, images, and CTA text on the public Home page."
        initial={record.content}
      />
    </div>
  );
}
