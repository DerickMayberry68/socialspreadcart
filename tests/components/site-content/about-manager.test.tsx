import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { AboutManager } from "@/components/admin/site-content/about-manager";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("AboutManager", () => {
  const initialContent = {
    content: {
      tenant_id: "t1",
      eyebrow: "About Eye",
      title: "About Title",
      description: "About Desc",
      story_badge: "Badge",
      story_title: "Story title",
      story_body: ["Para 1"],
      updated_at: "",
      updated_by: "",
    },
    images: [
      { id: "img1", display_order: 1, image_url: "about.jpg", storage_path: null, alt_text: "Alt about", is_active: true }
    ],
    featureCards: [
      { display_order: 1, title: "Card 1", body: "Body 1", icon_key: "heart-handshake" },
      { display_order: 2, title: "Card 2", body: "Body 2", icon_key: "sparkles" },
      { display_order: 3, title: "Card 3", body: "Body 3", icon_key: "map-pin" },
    ]
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with complex properties", () => {
    render(<AboutManager initial={initialContent as any} />);
    expect(screen.getByDisplayValue("About Eye")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Para 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Body 3")).toBeInTheDocument();
  });

  it("submits the correct mapped payload", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, content: initialContent.content, images: initialContent.images, featureCards: initialContent.featureCards }),
    });
    global.fetch = mockFetch;

    render(<AboutManager initial={initialContent as any} />);

    const badgeInput = screen.getByDisplayValue("Badge");
    await user.clear(badgeInput);
    await user.type(badgeInput, "New Badge");

    const saveButton = screen.getByRole("button", { name: /save about content/i });
    await user.click(saveButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/site-content/about", expect.objectContaining({
      method: "PATCH",
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.content.story_badge).toBe("New Badge");
  });
});
