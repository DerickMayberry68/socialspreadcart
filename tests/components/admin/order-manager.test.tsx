import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderManager } from "@/components/admin/order-manager";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("OrderManager", () => {
  it("renders empty order state", () => {
    render(<OrderManager orders={[]} />);

    expect(screen.getByText(/no guest orders yet/i)).toBeInTheDocument();
  });

  it("renders guest order details", () => {
    render(
      <OrderManager
        orders={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            tenant_id: "11111111-1111-4111-8111-111111111111",
            guest_name: "Jane Guest",
            guest_email: "jane@example.com",
            guest_phone: null,
            fulfillment_type: "pickup",
            fulfillment_requested_at: null,
            fulfillment_notes: "Front table",
            subtotal_cents: 4500,
            tax_cents: 0,
            fee_cents: 0,
            total_cents: 4500,
            currency: "usd",
            status: "paid",
            payment_status: "paid",
            created_at: "",
            updated_at: "",
            payment: null,
            items: [
              {
                menu_item_id: "menu-1",
                name: "Classic Tray",
                slug: "classic-tray",
                unit_price_cents: 4500,
                quantity: 1,
                line_total_cents: 4500,
                notes: null,
                options: {},
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText("Jane Guest")).toBeInTheDocument();
    expect(screen.getByText("Classic Tray")).toBeInTheDocument();
    expect(screen.getAllByText("$45.00").length).toBeGreaterThan(0);
  });
});
