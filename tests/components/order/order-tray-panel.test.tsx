import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  addOrderTrayItem,
  clearOrderTray,
  OrderTrayPanel,
} from "@/components/order/order-tray-panel";

describe("OrderTrayPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearOrderTray();
  });

  it("shows added item totals", async () => {
    addOrderTrayItem({
      menuItemId: "menu-1",
      name: "Classic Tray",
      slug: "classic-tray",
      priceCents: 2500,
      imageUrl: "/food/classic.jpg",
    });

    render(<OrderTrayPanel />);

    expect(await screen.findByText("Classic Tray")).toBeInTheDocument();
    expect(screen.getAllByText("$25.00").length).toBeGreaterThan(0);
  });

  it("updates quantity, removes items, and preserves notes", async () => {
    const user = userEvent.setup();
    addOrderTrayItem({
      menuItemId: "menu-1",
      name: "Classic Tray",
      slug: "classic-tray",
      priceCents: 2500,
      imageUrl: "/food/classic.jpg",
    });

    render(<OrderTrayPanel />);

    await user.click(screen.getByLabelText(/increase classic tray quantity/i));
    expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);

    const note = screen.getByPlaceholderText(/optional prep/i);
    await user.type(note, "No nuts");
    expect(window.localStorage.getItem("socialspreadcart:order-tray")).toContain("No nuts");

    await user.click(screen.getByText(/remove/i));
    expect(screen.getByText(/your order tray is empty/i)).toBeInTheDocument();
  });
});
