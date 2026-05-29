"use client";

import * as React from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { AdminDataGrid, type AdminDataGridColumn } from "@/components/admin/admin-data-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CustomerReview, CustomerReviewStatus, SortDirection } from "@/lib/types";
import type { ReviewSort } from "@/services/review-service";

export function ReviewManager({
  reviews: initialReviews,
  query = {},
  sort = "submitted_at",
  direction = "desc",
}: {
  reviews: CustomerReview[];
  query?: Record<string, string | undefined>;
  sort?: ReviewSort;
  direction?: SortDirection;
}) {
  const [reviews, setReviews] = React.useState(initialReviews);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

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

  const columns: Array<AdminDataGridColumn<ReviewSort>> = [
    { key: "reviewer", label: "Reviewer", sortable: true, sortKey: "display_name" },
    { key: "rating", label: "Rating", sortable: true, sortKey: "rating" },
    { key: "occasion", label: "Occasion", sortable: true, sortKey: "occasion" },
    { key: "submitted", label: "Submitted", sortable: true, sortKey: "submitted_at" },
    { key: "status", label: "Status", sortable: true, sortKey: "status" },
    { key: "note", label: "Admin note" },
  ];

  return (
    <AdminDataGrid<ReviewSort>
      pathname="/admin/reviews"
      query={query}
      sort={sort}
      direction={direction}
      columns={columns}
      minWidthClassName="min-w-[1120px]"
      rows={reviews.map((review) => ({
        id: review.id,
        state: review.status === "hidden" || review.status === "rejected" ? "muted" : "active",
        cells: {
          reviewer: (
            <div className="min-w-0">
              <p className="truncate font-medium">{review.display_name}</p>
              <p className="truncate text-xs text-ink/50">
                {review.customer_email || "No email"}
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink/55">
                {review.review_text}
              </p>
            </div>
          ),
          rating: (
            <span className="inline-flex items-center gap-1 text-[#ad7a54]">
              <Star className="h-3.5 w-3.5 fill-current" />
              {review.rating}
            </span>
          ),
          occasion: review.occasion || "No occasion",
          submitted: new Date(review.submitted_at).toLocaleDateString(),
          status: (
            <span className="rounded-full bg-[#eef4e9] px-2.5 py-1 text-xs font-medium capitalize text-[#4f684d]">
              {review.status}
            </span>
          ),
          note: (
            <label className="block">
              <span className="sr-only">Admin note for {review.display_name}</span>
              <textarea
                id={`note-${review.id}`}
                aria-label={`Admin note for ${review.display_name}`}
                defaultValue={review.admin_note ?? ""}
                rows={2}
                className="w-full rounded-[14px] border border-sage/20 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-sage"
              />
            </label>
          ),
        },
        actions: (
          <div className="flex flex-wrap justify-end gap-2">
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
        ),
      }))}
      emptyState={
        <Card className="m-6 p-8 text-center">
          <p className="font-heading text-3xl text-[#284237]">No reviews match that view.</p>
          <p className="mt-2 text-sm text-ink/60">New customer submissions will appear here.</p>
        </Card>
      }
    />
  );
}
