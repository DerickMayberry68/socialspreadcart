import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { HeroForm } from "@/components/admin/site-content/hero-form";

// Mock the internal Toast toaster
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("HeroForm", () => {
  const initialContent = {
    tenant_id: "t1",
    headline: "Test Headline",
    sub_line: "Test Subline",
    body: "Test Body",
    primary_cta_label: "Start",
    primary_cta_target: "/start",
    secondary_cta_label: "",
    secondary_cta_target: "",
    updated_at: new Date().toISOString(),
    updated_by: "user1",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with initial content", () => {
    render(<HeroForm initial={initialContent} />);
    expect(screen.getByDisplayValue("Test Headline")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Body")).toBeInTheDocument();
  });

  it("posts proper payload and floating button acts as submit", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, hero: initialContent }),
    });
    global.fetch = mockFetch;

    render(<HeroForm initial={initialContent} />);

    const labelInput = screen.getByDisplayValue("Start");
    await user.clear(labelInput);
    await user.type(labelInput, "Go Go Go");

    // The floating save button
    const saveButton = screen.getByRole("button", { name: /save hero content/i });
    await user.click(saveButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/site-content/hero", expect.objectContaining({
      method: "PATCH",
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.primary_cta_label).toBe("Go Go Go");
  });
});
