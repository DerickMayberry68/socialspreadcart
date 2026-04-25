import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ShellContentForm } from "@/components/admin/site-content/shell-content-form";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export const metadata = {
  title: "Shared Site Content",
};

export default async function AdminShellContentPage() {
  const record = await withCurrentTenant((tenantId) =>
    SiteContentService.getMarketingPageContent(tenantId, "shell"),
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
          Shared site content
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Edit navigation, header strip copy, footer copy, contact details,
          social links, and booking CTA fields used across the public site.
        </p>
      </div>

      <ShellContentForm initial={record.content} />
    </div>
  );
}
