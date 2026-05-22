import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FloatingCta } from "@/components/shared/floating-cta";

describe("FloatingCta", () => {
  it("stacks contact above leave review and book the cart", () => {
    render(<FloatingCta />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent(/^contact$/i);
    expect(links[0]).toHaveAttribute("href", "/contact");
    expect(links[1]).toHaveTextContent(/leave a review/i);
    expect(links[1]).toHaveAttribute("href", "/reviews");
    expect(links[2]).toHaveTextContent(/book the cart/i);
    expect(links[2]).toHaveAttribute("href", "/contact");
  });
});
