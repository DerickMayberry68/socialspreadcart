import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewManager } from "@/components/admin/review-manager";
import type { CustomerReview } from "@/lib/types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const baseReview: CustomerReview = {
  id: "22222222-2222-4222-8222-222222222222",
  tenant_id: "11111111-1111-4111-8111-111111111111",
  display_name: "Avery M.",
  rating: 5,
  review_text: "The cart was the best part of the event.",
  occasion: "Shower",
  customer_email: "avery@example.com",
  customer_phone: "",
  status: "pending",
  source: "floating_cta",
  admin_note: null,
  submitted_at: "2026-05-22T18:00:00.000Z",
  approved_at: null,
  approved_by: null,
  rejected_at: null,
  rejected_by: null,
  hidden_at: null,
  hidden_by: null,
  created_at: "2026-05-22T18:00:00.000Z",
  updated_at: "2026-05-22T18:00:00.000Z",
};

describe("ReviewManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders pending reviews and moderates them", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock;

    render(<ReviewManager reviews={[baseReview]} />);

    expect(screen.getByText("Avery M.")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/admin note/i), "Good public note");
    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/reviews/22222222-2222-4222-8222-222222222222/status",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ status: "approved", adminNote: "Good public note" });
  });

  it("shows an empty state when no reviews match the current view", () => {
    render(<ReviewManager reviews={[]} />);

    expect(screen.getByText(/no reviews match that view/i)).toBeInTheDocument();
  });
});
