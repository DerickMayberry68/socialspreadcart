import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { QuoteStatusSelect } from "@/components/admin/quote-status-select";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const CONTACT_ID = "22222222-2222-4222-8222-222222222222";

describe("QuoteStatusSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("patches numeric quote ids and reports success", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <QuoteStatusSelect
        quoteId="8"
        contactId={CONTACT_ID}
        current="new"
      />,
    );

    await user.click(screen.getByRole("button", { name: /set status in progress/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/quotes/8/status",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      status: "in_progress",
      contactId: CONTACT_ID,
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Quote status updated.");
  });

  it("shows an error toast when the status update is rejected", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, message: "Invalid fields." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteStatusSelect quoteId="8" current="new" />);

    await user.click(screen.getByRole("button", { name: /set status booked/i }));

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Invalid fields."),
    );
  });
});
