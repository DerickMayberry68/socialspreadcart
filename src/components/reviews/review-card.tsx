import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { PublicCustomerReview } from "@/lib/types";

export function ReviewCard({ review }: { review: PublicCustomerReview }) {
  return (
    <Card className="h-full rounded-[34px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-6 shadow-[0_28px_70px_rgba(56,66,44,0.22)] backdrop-blur-xl">
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
