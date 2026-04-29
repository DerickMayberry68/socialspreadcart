import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("@/services/order-service", () => ({
  OrderService: {
    createCheckout: vi.fn(),
  },
}));

import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";
import { POST } from "@/app/api/checkout/route";

const getCurrentTenantMock = vi.mocked(getCurrentTenant);
const createCheckoutMock = vi.mocked(OrderService.createCheckout);

describe("POST /api/checkout", () => {
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

  it("returns checkout session for a valid request", async () => {
    createCheckoutMock.mockResolvedValue({
      orderId: "22222222-2222-4222-8222-222222222222",
      paymentStatus: "pending",
      checkoutUrl: "https://checkout.test",
    });

    const response = await POST(
      new Request("https://site.test/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: [{ menuItemId: "menu-1", quantity: 1, notes: "" }],
          guest: { name: "Guest", email: "guest@example.com", phone: "" },
          fulfillment: { type: "pickup", requestedAt: null, notes: "" },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ checkoutUrl: "https://checkout.test" });
    expect(createCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });

  it("returns conflict when order review is required", async () => {
    const error = new Error("One or more selected items are no longer available.");
    error.name = "OrderReviewRequiredError";
    createCheckoutMock.mockRejectedValue(error);

    const response = await POST(
      new Request("https://site.test/api/checkout", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      }),
    );

    expect(response.status).toBe(409);
  });
});
