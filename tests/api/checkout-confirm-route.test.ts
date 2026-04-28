import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("@/services/order-service", () => ({
  OrderService: {
    getCheckoutConfirmation: vi.fn(),
  },
}));

import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";
import { GET } from "@/app/api/checkout/confirm/route";

const getCurrentTenantMock = vi.mocked(getCurrentTenant);
const getConfirmationMock = vi.mocked(OrderService.getCheckoutConfirmation);

describe("GET /api/checkout/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentTenantMock.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      slug: "shayley",
      name: "Shayley",
      status: "active",
      created_at: "",
      updated_at: "",
    });
  });

  it("returns paid order confirmation", async () => {
    getConfirmationMock.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      tenant_id: "11111111-1111-4111-8111-111111111111",
      guest_name: "Guest",
      guest_email: "guest@example.com",
      guest_phone: null,
      fulfillment_type: "pickup",
      fulfillment_requested_at: null,
      fulfillment_notes: null,
      subtotal_cents: 2500,
      tax_cents: 0,
      fee_cents: 0,
      total_cents: 2500,
      currency: "usd",
      status: "paid",
      payment_status: "paid",
      created_at: "",
      updated_at: "",
      items: [],
      payment: null,
    });

    const response = await GET(
      new Request("https://site.test/api/checkout/confirm?orderId=22222222-2222-4222-8222-222222222222"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  it("returns pending response when payment has not completed", async () => {
    getConfirmationMock.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      tenant_id: "11111111-1111-4111-8111-111111111111",
      guest_name: "Guest",
      guest_email: "guest@example.com",
      guest_phone: null,
      fulfillment_type: "pickup",
      fulfillment_requested_at: null,
      fulfillment_notes: null,
      subtotal_cents: 2500,
      tax_cents: 0,
      fee_cents: 0,
      total_cents: 2500,
      currency: "usd",
      status: "payment_pending",
      payment_status: "pending",
      created_at: "",
      updated_at: "",
      items: [],
      payment: null,
    });

    const response = await GET(
      new Request("https://site.test/api/checkout/confirm?orderId=22222222-2222-4222-8222-222222222222"),
    );

    expect(response.status).toBe(409);
  });
});
