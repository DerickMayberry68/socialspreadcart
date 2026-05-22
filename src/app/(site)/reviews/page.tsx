import type { Metadata } from "next";

import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { withCurrentTenant } from "@/lib/tenant";
import { ReviewService } from "@/services/review-service";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Leave a review or read approved notes from Social Spread Cart customers.",
  alternates: {
    canonical: "/reviews",
  },
};

export default async function ReviewsPage() {
  const reviews = await withCurrentTenant(ReviewService.listApprovedReviews);

  return (
    <div className="pb-16">
      <SectionShell className="py-16">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeading
            eyebrow="Leave a Review"
            title="Tell us what made your order or event memorable."
            description="Reviews are checked before publication so the public page stays helpful, polished, and privacy-safe."
          />
          <ReviewForm />
        </div>
      </SectionShell>
      <ReviewsSection reviews={reviews} showEmptyState />
    </div>
  );
}
