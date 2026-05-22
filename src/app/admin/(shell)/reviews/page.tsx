import { ReviewManager } from "@/components/admin/review-manager";
import { withCurrentTenant } from "@/lib/tenant";
import { ReviewService } from "@/services/review-service";

export default async function AdminReviewsPage() {
  const reviews = await withCurrentTenant(ReviewService.listAdminReviews);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-ink/45">
          Customer Reviews
        </p>
        <h1 className="mt-2 font-heading text-4xl text-[#284237]">
          Review moderation
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/62">
          Approve useful customer notes, reject inappropriate submissions, and hide
          approved reviews when they should no longer appear publicly.
        </p>
      </div>
      <ReviewManager reviews={reviews} />
    </div>
  );
}
