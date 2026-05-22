import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("@/services/review-service", () => ({
  ReviewService: {
    createPendingReview: vi.fn(),
    listApprovedReviews: vi.fn(),
  },
}));

import { getCurrentTenant } from "@/lib/tenant";
import { ReviewService } from "@/services/review-service";
import { GET, POST } from "@/app/api/reviews/route";

const tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "shayley",
  name: "Shayley",
  status: "active",
  created_at: "",
  updated_at: "",
};

describe("/api/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentTenant).mockResolvedValue(tenant as never);
  });

  it("creates pending reviews scoped to the current tenant", async () => {
    vi.mocked(ReviewService.createPendingReview).mockResolvedValue({ id: "review-1" } as never);

    const response = await POST(
      new Request("https://site.test/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          displayName: "Avery M.",
          rating: 5,
          reviewText: "The cart was the best part of the party.",
          occasion: "Birthday party",
          customerEmail: "avery@example.com",
          customerPhone: "",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(ReviewService.createPendingReview).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: tenant.id,
        displayName: "Avery M.",
        rating: 5,
      }),
    );
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Review submitted for approval.",
    });
  });

  it("returns validation errors without creating a review", async () => {
    const response = await POST(
      new Request("https://site.test/api/reviews", {
        method: "POST",
        body: JSON.stringify({ displayName: "", rating: 7, reviewText: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(ReviewService.createPendingReview).not.toHaveBeenCalled();
  });

  it("lists approved reviews without private fields", async () => {
    vi.mocked(ReviewService.listApprovedReviews).mockResolvedValue([
      {
        id: "review-1",
        display_name: "Avery M.",
        rating: 5,
        review_text: "Loved it.",
        occasion: "Shower",
        approved_at: "2026-05-22T18:00:00.000Z",
      },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(ReviewService.listApprovedReviews).toHaveBeenCalledWith(tenant.id);
    expect(json.reviews[0]).not.toHaveProperty("customer_email");
    expect(json.reviews[0]).not.toHaveProperty("admin_note");
  });
});
