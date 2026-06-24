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
            tax_cents: 438,
            fee_cents: 132,
            total_cents: 5070,
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
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByText(/Qty 1 - \$45\.00/)).toBeInTheDocument();
    expect(screen.getByText("Tax $4.38")).toBeInTheDocument();
    expect(screen.getByText("Fee $1.32")).toBeInTheDocument();
    expect(screen.getByText("$50.70")).toBeInTheDocument();
  });

  it("shows Square reconciliation details without exposing secrets", () => {
    render(
      <OrderManager
        orders={[
          {
            id: "22222222-2222-4222-8222-222222222222",
            tenant_id: "11111111-1111-4111-8111-111111111111",
            guest_name: "Square Guest",
            guest_email: "square@example.com",
            guest_phone: null,
            fulfillment_type: "pickup",
            fulfillment_requested_at: null,
            fulfillment_notes: null,
            subtotal_cents: 2500,
            tax_cents: 250,
            fee_cents: 63,
            total_cents: 2813,
            currency: "usd",
            status: "paid",
            payment_status: "paid",
            created_at: "",
            updated_at: "",
            items: [],
            payment: {
              id: "payment-record-1",
              tenant_id: "11111111-1111-4111-8111-111111111111",
              order_id: "22222222-2222-4222-8222-222222222222",
              provider: "square",
              provider_session_id: "square-link-123456789",
              provider_checkout_id: "square-link-123456789",
              provider_order_id: "square-order-987654321",
              provider_payment_intent_id: "square-payment-123456789",
              provider_refund_id: null,
              amount_cents: 2813,
              amount_subtotal_cents: 2500,
              amount_tax_cents: 250,
              amount_fee_cents: 63,
              refunded_amount_cents: 0,
              currency: "usd",
              status: "paid",
              raw_event_id: "event-1",
              tax_calculation_id: null,
              checkout_expires_at: null,
              superseded_at: null,
              created_at: "",
              updated_at: "",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("square")).toBeInTheDocument();
    expect(screen.getByText("square-payme")).toBeInTheDocument();
  });
});
