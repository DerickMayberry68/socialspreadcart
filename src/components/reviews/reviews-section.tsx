import Link from "next/link";

import { ReviewCard } from "@/components/reviews/review-card";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Button } from "@/components/ui/button";
import type { PublicCustomerReview } from "@/lib/types";

export function ReviewsSection({
  reviews,
  showEmptyState = false,
}: {
  reviews: PublicCustomerReview[];
  showEmptyState?: boolean;
}) {
  if (reviews.length === 0 && !showEmptyState) return null;

  return (
    <SectionShell className="mt-24">
      <SectionHeading
        eyebrow="Customer Reviews"
        title="Customer reviews from recent hosts and guests."
        description="Approved notes from people who have ordered, hosted, or visited The Social Spread Cart."
        align="center"
      />
      {reviews.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review, index) => (
            <Reveal key={review.id} delay={index * 0.06}>
              <ReviewCard review={review} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-2xl rounded-[34px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-8 text-center shadow-[0_28px_70px_rgba(56,66,44,0.18)] backdrop-blur-xl">
          <p className="font-heading text-3xl text-[#284237]">
            Be the first to leave a note.
          </p>
          <p className="mt-4 text-base leading-7 text-ink/66">
            Reviews are shown after approval so the page stays useful and trustworthy.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/reviews">Leave a Review</Link>
          </Button>
        </div>
      )}
    </SectionShell>
  );
}
