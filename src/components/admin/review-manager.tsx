"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CustomerReview, CustomerReviewStatus } from "@/lib/types";

const statuses: CustomerReviewStatus[] = ["pending", "approved", "rejected", "hidden"];

export function ReviewManager({ reviews: initialReviews }: { reviews: CustomerReview[] }) {
  const [reviews, setReviews] = React.useState(initialReviews);
  const [status, setStatus] = React.useState<CustomerReviewStatus>("pending");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const visible = reviews.filter((review) => review.status === status);

  async function moderate(review: CustomerReview, nextStatus: CustomerReviewStatus) {
    setBusyId(review.id);
    const note = (document.getElementById(`note-${review.id}`) as HTMLTextAreaElement | null)?.value;

    const response = await fetch(`/api/admin/reviews/${review.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, adminNote: note ?? review.admin_note ?? "" }),
    });
    const result = await response.json().catch(() => ({}));
    setBusyId(null);

    if (!response.ok || !result.ok) {
      toast.error(result.message ?? "Review could not be updated.");
      return;
    }

    setReviews((current) =>
      current.map((item) =>
        item.id === review.id
          ? {
              ...item,
              status: nextStatus,
              admin_note: note ?? item.admin_note,
            }
          : item,
      ),
    );
    toast.success("Review updated.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
              status === item
                ? "bg-sage text-cream shadow-soft"
                : "border border-sage/20 bg-white/70 text-sage hover:bg-[#eef4e9]"
            }`}
          >
            {item}
            <span className="ml-2 opacity-70">
              {reviews.filter((review) => review.status === item).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-heading text-3xl text-[#284237]">No {status} reviews.</p>
          <p className="mt-2 text-sm text-ink/60">New customer submissions will appear here.</p>
        </Card>
      ) : (
        <div className="grid gap-5">
          {visible.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8c5a36]">
                    {review.rating} stars{review.occasion ? ` - ${review.occasion}` : ""}
                  </p>
                  <h2 className="mt-2 font-heading text-3xl text-[#284237]">
                    {review.display_name}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-ink/70">{review.review_text}</p>
                  <div className="mt-4 grid gap-2 text-sm text-ink/58 sm:grid-cols-2">
                    <span>{review.customer_email || "No email"}</span>
                    <span>{review.customer_phone || "No phone"}</span>
                    <span>Submitted {new Date(review.submitted_at).toLocaleDateString()}</span>
                    <span>Source {review.source}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.2em] text-ink/50">
                    Admin note
                    <textarea
                      id={`note-${review.id}`}
                      defaultValue={review.admin_note ?? ""}
                      rows={4}
                      className="mt-2 w-full rounded-[18px] border border-sage/20 bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-sage"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => moderate(review, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => moderate(review, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => moderate(review, "hidden")}
                    >
                      Hide
                    </Button>
                    {review.status !== "pending" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        disabled={busyId === review.id}
                        onClick={() => moderate(review, "pending")}
                      >
                        Reopen
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
