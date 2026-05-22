import type { Metadata } from "next";

import { HomePage } from "@/components/sections/home-page";
import { getGalleryItems } from "@/lib/data";
import { withCurrentTenant } from "@/lib/tenant";
import { EventService } from "@/services/event-service";
import { MenuService } from "@/services/menu-service";
import { SiteContentService } from "@/services/site-content-service";
import { TestimonialService } from "@/services/testimonial-service";
import { ReviewService } from "@/services/review-service";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function IndexPage() {
  const [menuItems, events, testimonials, reviews, gallery, content, pageContent] = await Promise.all([
    withCurrentTenant(MenuService.listMenuItems),
    withCurrentTenant(EventService.listEvents),
    withCurrentTenant(TestimonialService.listTestimonials),
    withCurrentTenant(ReviewService.listApprovedReviews),
    getGalleryItems(),
    withCurrentTenant(SiteContentService.loadHomePageContent),
    withCurrentTenant((tenantId) =>
      SiteContentService.getMarketingPageContent(tenantId, "home"),
    ),
  ]);

  return (
    <HomePage
      menuItems={menuItems}
      events={events}
      testimonials={testimonials}
      reviews={reviews}
      gallery={gallery}
      content={content}
      marketingContent={pageContent.content}
    />
  );
}
