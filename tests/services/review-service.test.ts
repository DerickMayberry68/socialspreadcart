import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceRoleClient: vi.fn(),
}));

import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { ReviewService } from "@/services/review-service";

function chain(result: unknown) {
  const api: Record<string, unknown> = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    ilike: vi.fn(() => api),
    gte: vi.fn(() => api),
    order: vi.fn(() => api),
    limit: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    insert: vi.fn(() => api),
    update: vi.fn(() => api),
  };
  return api;
}

describe("ReviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns approved public projections without private fields", async () => {
    const query = chain({
      data: [
        {
          id: "review-1",
          tenant_id: "11111111-1111-4111-8111-111111111111",
          display_name: "Avery M.",
          rating: 5,
          review_text: "Loved it.",
          occasion: "Shower",
          customer_email: "avery@example.com",
          admin_note: "private",
          status: "approved",
          source: "test",
          submitted_at: "",
          approved_at: "2026-05-22T18:00:00.000Z",
          created_at: "",
          updated_at: "",
        },
      ],
      error: null,
    });
    vi.mocked(getSupabaseServiceRoleClient).mockReturnValue({
      from: vi.fn(() => query),
    } as never);

    const reviews = await ReviewService.listApprovedReviews(
      "11111111-1111-4111-8111-111111111111",
    );

    expect(reviews).toEqual([
      {
        id: "review-1",
        display_name: "Avery M.",
        rating: 5,
        review_text: "Loved it.",
        occasion: "Shower",
        approved_at: "2026-05-22T18:00:00.000Z",
      },
    ]);
  });

  it("creates new reviews as pending and blocks recent duplicates", async () => {
    const duplicateQuery = chain({ data: null, error: null });
    const insertQuery = chain({
      data: {
        id: "review-1",
        tenant_id: "11111111-1111-4111-8111-111111111111",
        display_name: "Avery M.",
        rating: 5,
        review_text: "The cart was the best part of the event.",
        occasion: "Shower",
        customer_email: null,
        customer_phone: null,
        status: "pending",
        source: "floating_cta",
        submitted_at: "",
        created_at: "",
        updated_at: "",
      },
      error: null,
    });
    const from = vi.fn()
      .mockReturnValueOnce(duplicateQuery)
      .mockReturnValueOnce(insertQuery);
    vi.mocked(getSupabaseServiceRoleClient).mockReturnValue({ from } as never);

    await ReviewService.createPendingReview({
      tenantId: "11111111-1111-4111-8111-111111111111",
      displayName: "Avery M.",
      rating: 5,
      reviewText: "The cart was the best part of the event.",
      occasion: "Shower",
      source: "floating_cta",
    });

    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "11111111-1111-4111-8111-111111111111",
        display_name: "Avery M.",
        status: "pending",
      }),
    );

    vi.mocked(getSupabaseServiceRoleClient).mockReturnValue({
      from: vi.fn(() => chain({ data: { id: "review-1" }, error: null })),
    } as never);

    await expect(
      ReviewService.createPendingReview({
        tenantId: "11111111-1111-4111-8111-111111111111",
        displayName: "Avery M.",
        rating: 5,
        reviewText: "The cart was the best part of the event.",
      }),
    ).rejects.toThrow(/already submitted/i);
  });

  it("writes moderation updates scoped by tenant and review id", async () => {
    const query = chain({ data: { id: "review-1" }, error: null });
    vi.mocked(getSupabaseServiceRoleClient).mockReturnValue({
      from: vi.fn(() => query),
    } as never);

    await ReviewService.moderateReview({
      tenantId: "11111111-1111-4111-8111-111111111111",
      reviewId: "22222222-2222-4222-8222-222222222222",
      userId: "33333333-3333-4333-8333-333333333333",
      status: "approved",
      adminNote: "Looks good",
    });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        admin_note: "Looks good",
        approved_by: "33333333-3333-4333-8333-333333333333",
      }),
    );
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "11111111-1111-4111-8111-111111111111");
    expect(query.eq).toHaveBeenCalledWith("id", "22222222-2222-4222-8222-222222222222");
  });
});
