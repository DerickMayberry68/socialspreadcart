import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PageContentForm } from "@/components/admin/site-content/page-content-form";

// Mock the internal Toast toaster
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PageContentForm", () => {
  const initialContent = {
    hero_badge: "Test Badge",
    hero_kicker: "Test Kicker",
    proof_stats: [{ label: "Stat", value: "100", note: "" }],
    menu_section: {
      title: "Menu Title",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with initial nested content", () => {
    render(
      <PageContentForm
        pageKey="home"
        title="Test Form"
        description="A form for testing."
        initial={initialContent as any}
      />
    );

    expect(screen.getByText("Test Form")).toBeInTheDocument();
    
    // Check top-level strings
    const badgeInput = screen.getByDisplayValue("Test Badge");
    expect(badgeInput).toBeInTheDocument();

    // Check array mapping
    const statLabelInput = screen.getByDisplayValue("Stat");
    expect(statLabelInput).toBeInTheDocument();
    const statValueInput = screen.getByDisplayValue("100");
    expect(statValueInput).toBeInTheDocument();

    // Check object nesting
    const menuTitleInput = screen.getByDisplayValue("Menu Title");
    expect(menuTitleInput).toBeInTheDocument();
  });

  it("submits the correct JSON patch payload", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, content: initialContent }),
    });
    global.fetch = mockFetch;

    render(
      <PageContentForm
        pageKey="home"
        title="Test Form"
        description="A form for testing."
        initial={initialContent as any}
      />
    );

    // Modify a field
    const badgeInput = screen.getByDisplayValue("Test Badge");
    await user.clear(badgeInput);
    await user.type(badgeInput, "New Badge value");

    const saveButton = screen.getByRole("button", { name: /save content/i });
    await user.click(saveButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/site-content/page-content/home", expect.objectContaining({
      method: "PATCH",
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.content.hero_badge).toBe("New Badge value");
    expect(callBody.content.menu_section.title).toBe("Menu Title"); // Untouched nested data preserved
  });
});
