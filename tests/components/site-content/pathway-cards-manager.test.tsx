import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PathwayCardsManager } from "@/components/admin/site-content/pathway-cards-manager";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("PathwayCardsManager", () => {
  const initialCards = [
    { display_order: 1, title: "Card 1", body: "Body 1", badge: "Badge 1", link_target: "/1", image_url: "img1.png" },
    { display_order: 2, title: "Card 2", body: "Body 2", badge: "Badge 2", link_target: "/2", image_url: "img2.png" },
    { display_order: 3, title: "Card 3", body: "Body 3", badge: "Badge 3", link_target: "/3", image_url: "img3.png" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with multiple cards", () => {
    render(<PathwayCardsManager initial={initialCards as any} />);
    expect(screen.getByDisplayValue("Card 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Card 2")).toBeInTheDocument();
  });

  it("posts proper payload and floating button acts as submit", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, cards: initialCards }),
    });
    global.fetch = mockFetch;

    render(<PathwayCardsManager initial={initialCards as any} />);

    const card1Title = screen.getByDisplayValue("Card 1");
    await user.clear(card1Title);
    await user.type(card1Title, "Updated Card 1");

    const saveButton = screen.getByRole("button", { name: /save pathway cards/i });
    await user.click(saveButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/site-content/pathway-cards", expect.objectContaining({
      method: "PATCH",
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.cards[0].title).toBe("Updated Card 1");
  });
});
