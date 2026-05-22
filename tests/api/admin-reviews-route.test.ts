import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/require-tenant-admin", () => ({
  requireTenantAdmin: vi.fn(),
}));

vi.mock("@/services/review-service", () => ({
  ReviewService: {
    listAdminReviews: vi.fn(),
    moderateReview: vi.fn(),
  },
}));

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { ReviewService } from "@/services/review-service";
import { GET } from "@/app/api/admin/reviews/route";
import { PATCH } from "@/app/api/admin/reviews/[id]/status/route";

const tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "shayley",
  name: "Shayley",
  status: "active",
  created_at: "",
  updated_at: "",
};

describe("/api/admin/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireTenantAdmin).mockResolvedValue({
      user: { id: "admin-1" },
      tenant,
    } as never);
  });

  it("short-circuits guard errors before listing reviews", async () => {
    vi.mocked(requireTenantAdmin).mockResolvedValueOnce({
      error: NextResponse.json({ ok: false }, { status: 401 }),
    });

    const response = await GET(new Request("https://site.test/api/admin/reviews"));

    expect(response.status).toBe(401);
    expect(ReviewService.listAdminReviews).not.toHaveBeenCalled();
  });

  it("lists reviews scoped to the guarded tenant", async () => {
    vi.mocked(ReviewService.listAdminReviews).mockResolvedValue([]);

    const response = await GET(
      new Request("https://site.test/api/admin/reviews?status=pending"),
    );

    expect(response.status).toBe(200);
    expect(ReviewService.listAdminReviews).toHaveBeenCalledWith(tenant.id, "pending");
  });

  it("moderates reviews scoped to the guarded tenant", async () => {
    vi.mocked(ReviewService.moderateReview).mockResolvedValue();

    const response = await PATCH(
      new Request("https://site.test/api/admin/reviews/review-1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "approved", adminNote: "Looks good" }),
      }),
      { params: Promise.resolve({ id: "22222222-2222-4222-8222-222222222222" }) },
    );

    expect(response.status).toBe(200);
    expect(ReviewService.moderateReview).toHaveBeenCalledWith({
      tenantId: tenant.id,
      reviewId: "22222222-2222-4222-8222-222222222222",
      userId: "admin-1",
      status: "approved",
      adminNote: "Looks good",
    });
  });
});
