import { FloatingCta } from "@/components/shared/floating-cta";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { withCurrentTenant } from "@/lib/tenant";
import { SiteContentService } from "@/services/site-content-service";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteConfig = await withCurrentTenant(
    SiteContentService.getSiteConfiguration,
  );

  return (
    <>
      <SiteHeader
        bookingCtaLabel={siteConfig.booking_cta_label}
        bookingCtaTarget={siteConfig.booking_cta_target}
      />
      <main>{children}</main>
      <SiteFooter
        bookingCtaLabel={siteConfig.booking_cta_label}
        bookingCtaTarget={siteConfig.booking_cta_target}
        supportPhone={siteConfig.support_phone}
        supportEmail={siteConfig.support_email}
      />
      <FloatingCta />
    </>
  );
}
