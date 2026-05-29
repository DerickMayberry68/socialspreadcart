import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { PublicCustomerReview } from "@/lib/types";

const ratingCardBackgrounds: Record<number, string> = {
  5: "linear-gradient(135deg, rgba(238, 248, 237, 0.98) 0%, rgba(210, 230, 202, 0.96) 54%, rgba(184, 214, 174, 0.94) 100%)",
  4: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 241, 227, 0.82) 48%, rgba(223, 232, 216, 0.9) 100%)",
  3: "linear-gradient(135deg, rgba(252, 243, 224, 0.95) 0%, rgba(248, 232, 200, 0.9) 52%, rgba(232, 201, 166, 0.86) 100%)",
  2: "linear-gradient(135deg, rgba(254, 240, 224, 0.95) 0%, rgba(247, 216, 200, 0.9) 52%, rgba(232, 184, 150, 0.86) 100%)",
  1: "linear-gradient(135deg, rgba(252, 225, 210, 0.95) 0%, rgba(244, 199, 178, 0.9) 52%, rgba(223, 160, 131, 0.86) 100%)",
};

export function ReviewCard({ review }: { review: PublicCustomerReview }) {
  const background =
    ratingCardBackgrounds[Math.round(review.rating)] ?? ratingCardBackgrounds[4];

  return (
    <Card
      className="h-full rounded-[34px] border border-sage/25 p-6 shadow-[0_28px_70px_rgba(56,66,44,0.22)] backdrop-blur-xl"
      data-rating={review.rating}
      style={{ background }}
    >
      <div className="flex gap-1 text-[#b8562e]" aria-label={`${review.rating} star review`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Sparkles
            key={index}
            className={`h-4 w-4 ${index < review.rating ? "fill-current" : "opacity-25"}`}
          />
        ))}
      </div>
      <p className="mt-5 text-lg leading-8 text-ink/72">&ldquo;{review.review_text}&rdquo;</p>
      <div className="mt-6">
        <p className="font-heading text-2xl text-[#284237]">{review.display_name}</p>
        {review.occasion ? (
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#8c5a36]">
            {review.occasion}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
