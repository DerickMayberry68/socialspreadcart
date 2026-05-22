import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/shared/site-header";

describe("SiteHeader", () => {
  it("removes Contact from header navigation while keeping booking CTA", () => {
    render(
      <SiteHeader
        navigation={[
          { title: "Home", href: "/" },
          { title: "Menu", href: "/menu" },
          { title: "Contact", href: "/contact" },
        ]}
      />,
    );

    expect(screen.queryByRole("link", { name: /^contact$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book the cart/i })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});
