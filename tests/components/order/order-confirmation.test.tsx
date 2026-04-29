import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderConfirmation } from "@/components/order/order-confirmation";
import type { GuestOrderSummary } from "@/lib/types/order";

function makeOrder(paymentStatus: GuestOrderSummary["payment_status"]) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    tenant_id: "11111111-1111-4111-8111-111111111111",
    guest_name: "Derick Mayberry",
    guest_email: "derick@example.com",
    guest_phone: null,
    fulfillment_type: "pickup",
    fulfillment_requested_at: null,
    fulfillment_notes: null,
    subtotal_cents: 100,
    tax_cents: 10,
    fee_cents: 3,
    total_cents: 113,
    currency: "usd",
    status: paymentStatus === "paid" ? "paid" : "payment_pending",
    payment_status: paymentStatus,
    created_at: "2026-04-29T00:00:00.000Z",
    updated_at: "2026-04-29T00:00:00.000Z",
    items: [
      {
        menu_item_id: "menu-1",
        name: "Test menu item",
        slug: "test-menu-item",
        unit_price_cents: 100,
        quantity: 1,
        line_total_cents: 100,
        notes: null,
        options: {},
      },
    ],
    payment: null,
  } satisfies GuestOrderSummary;
}

describe("OrderConfirmation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates pending payment copy when the confirmation API returns paid", async () => {
    const paidOrder = makeOrder("paid");
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, order: paidOrder }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderConfirmation order={makeOrder("pending")} />);

    expect(screen.getByText("Order total")).toBeInTheDocument();
    expect(screen.getByText("We are checking payment.")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Calculated tax")).toBeInTheDocument();
    expect(screen.getByText("Non-taxable processing fee")).toBeInTheDocument();
    expect(screen.getByText("$1.13")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Total paid")).toBeInTheDocument();
    });
    expect(screen.getByText("Your order is in.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/checkout/confirm?orderId=22222222-2222-4222-8222-222222222222",
      { cache: "no-store" },
    );
  });
});
