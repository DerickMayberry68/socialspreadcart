import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/image-compression", () => ({
  compressUpload: vi.fn(async (file: File) => file),
}));

import { EventManager } from "@/components/admin/event-manager";
import { compressUpload } from "@/lib/image-compression";
import type { EventItem } from "@/lib/types";

const baseEvent: EventItem = {
  id: "event-1",
  title: "Mama Palooza",
  date: "2026-07-01T18:00",
  location: "Salon H Ross",
  description: "Dirty soda pop-up.",
  image_url: "https://storage.test/original.jpg",
};

describe("EventManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads an image and fills the image URL while creating an event", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          imageUrl: "https://storage.test/uploaded-event.jpg",
        }),
        { status: 200 },
      ),
    );
    global.fetch = fetchMock;

    const { container } = render(<EventManager initial={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /new event/i }));

    const file = new File(["image"], "event.jpg", { type: "image/jpeg" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/events/upload", {
        method: "POST",
        body: expect.any(FormData),
      });
    });

    expect(compressUpload).toHaveBeenCalledWith(file);
    await waitFor(() => {
      expect(screen.getByLabelText(/image url/i)).toHaveValue(
        "https://storage.test/uploaded-event.jpg",
      );
    });
  });

  it("keeps the existing image URL when replacement upload fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          message: "Only image files can be uploaded.",
        }),
        { status: 400 },
      ),
    );
    global.fetch = fetchMock;

    const { container } = render(<EventManager initial={[baseEvent]} />);

    fireEvent.click(screen.getByRole("button", { name: /edit event/i }));

    expect(screen.getByLabelText(/image url/i)).toHaveValue(baseEvent.image_url);

    const file = new File(["not image"], "notes.txt", { type: "text/plain" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(screen.getByLabelText(/image url/i)).toHaveValue(baseEvent.image_url);
  });
});
