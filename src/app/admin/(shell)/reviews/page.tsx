import Link from "next/link";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { ReviewManager } from "@/components/admin/review-manager";
import { parseAdminListQuery } from "@/lib/admin/list-query";
import type { CustomerReviewStatus } from "@/lib/types";
import { withCurrentTenant } from "@/lib/tenant";
import { ReviewService } from "@/services/review-service";

const statuses: Array<CustomerReviewStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "hidden",
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    direction?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = parseAdminListQuery({
    params,
    allowedSorts: ["display_name", "rating", "occasion", "status", "submitted_at"] as const,
    defaultSort: "submitted_at",
  });
  const [reviewsPage, allReviews] = await Promise.all([
    withCurrentTenant(ReviewService.listAdminReviewsPage, query),
    withCurrentTenant(ReviewService.listAdminReviews),
  ]);
  const counts = statuses.reduce(
    (current, status) => ({
      ...current,
      [status]: status === "all"
        ? allReviews.length
        : allReviews.filter((review) => review.status === status).length,
    }),
    {} as Record<(typeof statuses)[number], number>,
  );
  const listQuery = {
    search: query.search,
    status: query.status,
    sort: query.sort,
    direction: query.direction,
  };

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
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const active = (query.status ?? "all") === status;
          const href = status === "all"
            ? "/admin/reviews"
            : `/admin/reviews?status=${status}`;

          return (
            <Link
              key={status}
              href={href}
              className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
                active
                  ? "bg-sage text-cream shadow-soft"
                  : "border border-sage/20 bg-white/70 text-sage hover:bg-[#eef4e9]"
              }`}
            >
              {status}
              <span className="ml-2 opacity-70">{counts[status]}</span>
            </Link>
          );
        })}
      </div>
      <section className="overflow-hidden rounded-[28px] border border-sage/10 bg-white shadow-soft">
        <div className="border-b border-sage/10 px-6 py-5">
          <h2 className="font-heading text-3xl text-[#284237]">Review list</h2>
          <p className="mt-1 text-sm text-ink/50">
            {reviewsPage.total} result{reviewsPage.total === 1 ? "" : "s"} found
          </p>
        </div>
        <ReviewManager
          reviews={reviewsPage.records}
          query={listQuery}
          sort={query.sort}
          direction={query.direction}
        />
        <AdminPagination
          pathname="/admin/reviews"
          query={listQuery}
          page={reviewsPage.page}
          pageCount={reviewsPage.pageCount}
          pageSize={reviewsPage.pageSize}
          total={reviewsPage.total}
        />
      </section>
    </div>
  );
}
