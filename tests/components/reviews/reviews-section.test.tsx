import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewsSection } from "@/components/reviews/reviews-section";

describe("ReviewsSection", () => {
  it("renders approved review cards", () => {
    render(
      <ReviewsSection
        reviews={[
          {
            id: "review-1",
            display_name: "Avery M.",
            rating: 5,
            review_text: "The cart made the shower feel special.",
            occasion: "Baby shower",
            approved_at: "2026-05-22T18:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Avery M.")).toBeInTheDocument();
    expect(screen.getByText(/made the shower feel special/i)).toBeInTheDocument();
    expect(screen.queryByText(/avery@example.com/i)).not.toBeInTheDocument();
  });

  it("renders a polished empty state when requested", () => {
    render(<ReviewsSection reviews={[]} showEmptyState />);

    expect(screen.getByText(/be the first to leave a note/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /leave a review/i })).toHaveAttribute(
      "href",
      "/reviews",
    );
  });
});
