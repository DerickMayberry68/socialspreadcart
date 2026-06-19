import Image from "next/image";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsCalendar } from "@/components/sections/events-calendar";
import { HomePage } from "@/components/sections/home-page";
import type { EventItem } from "@/lib/types";

const eventWithImage: EventItem = {
  id: "event-1",
  title: "Mama Palooza",
  date: "2026-07-01T18:00",
  location: "Salon H Ross",
  description: "Dirty soda pop-up.",
  image_url: "https://storage.test/events/mama-palooza.jpg",
};

function imageWasRenderedWith(src: string) {
  return vi.mocked(Image).mock.calls.some(([props]) => props.src === src);
}

describe("public event image display", () => {
  beforeEach(() => {
    vi.mocked(Image).mockClear();
  });

  it("renders uploaded event images in the home page events list", () => {
    render(
      <HomePage
        menuItems={[]}
        events={[eventWithImage]}
        testimonials={[]}
        reviews={[]}
        gallery={[]}
      />,
    );

    expect(imageWasRenderedWith(eventWithImage.image_url)).toBe(true);
  });

  it("renders uploaded event images in the events calendar list", () => {
    render(<EventsCalendar events={[eventWithImage]} />);

    expect(imageWasRenderedWith(eventWithImage.image_url)).toBe(true);
  });
});
