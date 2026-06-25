import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("@/services/order-service", () => ({
  OrderService: {
    createDeliveryPayment: vi.fn(),
  },
}));

import { POST } from "@/app/api/checkout/delivery-payment/route";
import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";

const getCurrentTenantMock = vi.mocked(getCurrentTenant);
const createDeliveryPaymentMock = vi.mocked(
  OrderService.createDeliveryPayment,
);

describe("POST /api/checkout/delivery-payment", () => {
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

  it("returns an approved delivery payment link", async () => {
    createDeliveryPaymentMock.mockResolvedValue({
      mode: "payment",
      orderId: "22222222-2222-4222-8222-222222222222",
      paymentStatus: "pending",
      checkoutUrl: "https://sandbox.square.link/u/test",
      totals: {
        subtotalCents: 2500,
        taxCents: 250,
        feeCents: 75,
        deliveryFeeCents: 500,
        totalCents: 3325,
        currency: "usd",
      },
    });

    const response = await POST(
      new Request("https://site.test/api/checkout/delivery-payment", {
        method: "POST",
        body: JSON.stringify({
          orderId: "22222222-2222-4222-8222-222222222222",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      checkoutUrl: "https://sandbox.square.link/u/test",
      totals: { deliveryFeeCents: 500, totalCents: 3325 },
    });
  });

  it.each([
    ["OrderNotFoundError", 404],
    ["OrderPaymentEligibilityError", 409],
    ["PaymentTotalsError", 422],
    ["PaymentConfigurationError", 503],
    ["PaymentProviderError", 503],
  ])("maps %s to %i", async (name, status) => {
    const error = new Error("Handled failure.");
    error.name = name;
    createDeliveryPaymentMock.mockRejectedValue(error);

    const response = await POST(
      new Request("https://site.test/api/checkout/delivery-payment", {
        method: "POST",
        body: JSON.stringify({
          orderId: "22222222-2222-4222-8222-222222222222",
        }),
      }),
    );

    expect(response.status).toBe(status);
  });
});
