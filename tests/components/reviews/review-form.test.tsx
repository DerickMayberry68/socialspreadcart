import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewForm } from "@/components/reviews/review-form";

describe("ReviewForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a valid review and shows pending approval confirmation", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: "Review submitted for approval." }),
    });
    global.fetch = fetchMock;

    render(<ReviewForm />);

    await user.type(screen.getByLabelText(/display name/i), "Avery M.");
    await user.type(screen.getByLabelText(/occasion/i), "Shower");
    await user.type(screen.getByLabelText(/^review/i), "The cart was the best part of the event.");
    await user.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/reviews", expect.any(Object)));
    expect(await screen.findByText(/submitted for approval/i)).toBeInTheDocument();
  });

  it("shows handled validation errors and preserves entered text", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        ok: false,
        message: "Please complete the required review fields.",
        fieldErrors: { reviewText: ["Please share a little more detail."] },
      }),
    });

    render(<ReviewForm />);
    const review = screen.getByLabelText(/^review/i);
    await user.type(review, "Too short");
    await user.click(screen.getByRole("button", { name: /submit review/i }));

    expect(await screen.findByText(/please share a little more detail/i)).toBeInTheDocument();
    expect(review).toHaveValue("Too short");
  });
});
