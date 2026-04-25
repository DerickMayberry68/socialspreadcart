import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageContentForm } from "@/components/admin/site-content/page-content-form";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata = {
  title: "Events Page Content",
};

export default async function AdminEventsPageContentPage() {
  const record = await withCurrentTenant((tenantId) =>
    SiteContentService.getMarketingPageContent(tenantId, "events"),
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
          Events page content
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Edit public Events page copy. Individual event records remain managed
          in the Events admin area.
        </p>
      </div>

      <PageContentForm
        pageKey="events"
        title="Events page copy"
        description="These fields control the Events page heading and explanatory cards above the calendar."
        initial={record.content}
      />
    </div>
  );
}
