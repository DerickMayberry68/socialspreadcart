import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { SiteConfigurationForm } from "@/components/admin/site-content/site-configuration-form";

// Mock the internal Toast toaster
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SiteConfigurationForm", () => {
  const initialContent = {
    tenant_id: "t1",
    brand_name: "Mock Brand",
    brand_tagline: "Mock Tagline",
    booking_cta_label: "Book Now",
    booking_cta_target: "/book",
    support_phone: "555-5555",
    support_email: "support@mock.com",
    updated_at: new Date().toISOString(),
    updated_by: "user1",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders configuration correctly", () => {
    render(<SiteConfigurationForm initial={initialContent} />);
    expect(screen.getByDisplayValue("Mock Brand")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mock Tagline")).toBeInTheDocument();
  });

  it("submits changes using the floating save button", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true, config: initialContent }),
    });
    global.fetch = mockFetch;

    render(<SiteConfigurationForm initial={initialContent} />);

    const emailInput = screen.getByDisplayValue("support@mock.com");
    await user.clear(emailInput);
    await user.type(emailInput, "new@mock.com");

    const saveButton = screen.getByRole("button", { name: /save configuration/i });
    await user.click(saveButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/admin/site-content/configuration", expect.objectContaining({
      method: "PATCH",
    }));

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.support_email).toBe("new@mock.com");
  });
});
