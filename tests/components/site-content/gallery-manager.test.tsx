import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GalleryManager } from "@/components/admin/site-content/gallery-manager";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("GalleryManager", () => {
  const initialContent = {
    section: {
      tenant_id: "t1",
      eyebrow: "Gallery Eye",
      title: "Gallery Title",
      description: "Gallery Desc",
      feature_card_eyebrow: "Feat Eye",
      feature_card_title: "Feat Title",
      support_card_body: "Support Body",
      updated_at: "",
      updated_by: "",
    },
    images: [
      { id: "g_img1", display_order: 1, title: "Image 1 Title", eyebrow: "Eye1", alt_text: "Alt1", image_url: "g1.jpg", storage_path: null, is_active: true },
      { id: "g_img2", display_order: 2, title: "Image 2 Title", eyebrow: "Eye2", alt_text: "Alt2", image_url: "g2.jpg", storage_path: null, is_active: true }
    ]
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with complex properties", () => {
    Object.defineProperty(window, 'history', {
      value: { state: {}, pushState: vi.fn(), back: vi.fn() },
      writable: true,
    });
    render(<GalleryManager initial={initialContent as any} />);
    expect(screen.getByDisplayValue("Gallery Eye")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Image 1 Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Image 2 Title")).toBeInTheDocument();
  });

  it("submits the correct payload", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, section: initialContent.section, images: initialContent.images }),
    });
    global.fetch = mockFetch;

    render(<GalleryManager initial={initialContent as any} />);

    const titleInput = screen.getByDisplayValue("Gallery Title");
    await user.clear(titleInput);
    await user.type(titleInput, "New Gallery Title");

    const saveButton = screen.getByRole("button", { name: /save gallery content/i });
    await user.click(saveButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/site-content/gallery", expect.objectContaining({
      method: "PATCH",
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.section.title).toBe("New Gallery Title");
  });
});
