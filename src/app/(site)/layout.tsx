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
  const shellContent = await withCurrentTenant((tenantId) =>
    SiteContentService.getMarketingPageContent(tenantId, "shell"),
  );
  const shell = shellContent.content;

  return (
    <>
      <SiteHeader
        navigation={shell.navigation}
        headerTopLeft={shell.header_top_left}
        headerTopRight={shell.header_top_right}
        bookingCtaLabel={shell.booking_cta_label}
        bookingCtaTarget={shell.booking_cta_target}
      />
      <main>{children}</main>
      <SiteFooter
        navigation={shell.navigation}
        bookingCtaLabel={shell.booking_cta_label}
        bookingCtaTarget={shell.booking_cta_target}
        ctaEyebrow={shell.footer_cta_eyebrow}
        ctaTitle={shell.footer_cta_title}
        description={shell.footer_description}
        location={shell.location}
        phone={shell.phone}
        email={shell.email}
        instagramLabel={shell.instagram_label}
        instagramUrl={shell.instagram_url}
      />
      <FloatingCta />
    </>
  );
}
