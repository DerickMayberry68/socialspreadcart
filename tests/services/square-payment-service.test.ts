import { beforeEach, describe, expect, it, vi } from "vitest";

const squareMocks = vi.hoisted(() => ({
  paymentLinkCreate: vi.fn(),
  paymentLinkDelete: vi.fn(),
  paymentLinkGet: vi.fn(),
  orderGet: vi.fn(),
  locationGet: vi.fn(),
  verifySignature: vi.fn(),
}));

vi.mock("square", () => {
  class SquareError extends Error {
    statusCode: number;
    errors: Array<{ detail?: string; code?: string }> = [];

    constructor({
      message = "Square request failed.",
      statusCode = 500,
    }: {
      message?: string;
      statusCode?: number;
    }) {
      super(message);
      this.statusCode = statusCode;
    }
  }

  return {
    SquareClient: vi.fn(() => ({
      checkout: {
        paymentLinks: {
          create: squareMocks.paymentLinkCreate,
          delete: squareMocks.paymentLinkDelete,
          get: squareMocks.paymentLinkGet,
        },
      },
      orders: {
        get: squareMocks.orderGet,
      },
      locations: {
        get: squareMocks.locationGet,
      },
    })),
    SquareEnvironment: {
      Sandbox: "https://connect.squareupsandbox.com",
      Production: "https://connect.squareup.com",
    },
    SquareError,
    WebhooksHelper: {
      verifySignature: squareMocks.verifySignature,
    },
  };
});

import type { GuestOrderSummary } from "@/lib/types/order";
import { SquarePaymentService } from "@/services/square-payment-service";
import { SquareError } from "square";

function makeOrder(overrides: Partial<GuestOrderSummary> = {}): GuestOrderSummary {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    tenant_id: "11111111-1111-4111-8111-111111111111",
    guest_name: "Guest",
    guest_email: "guest@example.com",
    guest_phone: "+14795550123",
    fulfillment_type: "pickup",
    fulfillment_requested_at: null,
    fulfillment_notes: null,
    fulfillment_address: null,
    delivery_status: "not_required",
    delivery_fee_cents: 0,
    subtotal_cents: 2500,
    tax_cents: 0,
    fee_cents: 0,
    total_cents: 2500,
    currency: "usd",
    status: "payment_pending",
    payment_status: "pending",
    created_at: "2026-06-23T20:00:00.000Z",
    updated_at: "2026-06-23T20:00:00.000Z",
    items: [
      {
        menu_item_id: "menu-1",
        name: "Classic Tray",
        slug: "classic-tray",
        unit_price_cents: 2500,
        quantity: 1,
        line_total_cents: 2500,
        notes: null,
        options: {},
      },
    ],
    payment: null,
    ...overrides,
  };
}

function pickupSquareOrder() {
  return {
    id: "square-order-1",
    locationId: "location-1",
    lineItems: [
      {
        name: "Classic Tray",
        quantity: "1",
        grossSalesMoney: { amount: BigInt(2500), currency: "USD" },
      },
    ],
    serviceCharges: [
      {
        name: "Processing fee",
        percentage: "2.5",
        totalMoney: { amount: BigInt(63), currency: "USD" },
      },
    ],
    totalMoney: { amount: BigInt(2813), currency: "USD" },
    totalTaxMoney: { amount: BigInt(250), currency: "USD" },
    totalServiceChargeMoney: { amount: BigInt(63), currency: "USD" },
  };
}

describe("SquarePaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SQUARE_ENVIRONMENT = "sandbox";
    process.env.SQUARE_ACCESS_TOKEN = "sandbox-token";
    process.env.SQUARE_LOCATION_ID = "location-1";
    process.env.SQUARE_PROCESSING_FEE_PERCENT = "2.5";
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = "signature-key";
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL =
      "https://preview.test/api/webhooks/square";
  });

  it("creates itemized hosted checkout with automatic tax and tipping disabled", async () => {
    squareMocks.paymentLinkCreate.mockResolvedValue({
      paymentLink: {
        id: "link-1",
        orderId: "square-order-1",
        url: "https://sandbox.square.link/u/test",
      },
      relatedResources: {
        orders: [pickupSquareOrder()],
      },
    });

    const result = await SquarePaymentService.createCheckoutSession({
      order: makeOrder(),
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(result).toMatchObject({
      provider: "square",
      checkoutId: "link-1",
      providerOrderId: "square-order-1",
      checkoutUrl: "https://sandbox.square.link/u/test",
      totals: {
        subtotalCents: 2500,
        taxCents: 250,
        feeCents: 63,
        deliveryFeeCents: 0,
        totalCents: 2813,
        currency: "usd",
      },
    });
    expect(squareMocks.paymentLinkCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({
          locationId: "location-1",
          referenceId: "22222222-2222-4222-8222-222222222222",
          serviceCharges: expect.arrayContaining([
            expect.objectContaining({
              name: "Processing fee",
              percentage: "2.5",
              taxable: false,
              scope: "ORDER",
            }),
          ]),
          pricingOptions: {
            autoApplyTaxes: true,
            autoApplyDiscounts: false,
          },
        }),
        checkoutOptions: expect.objectContaining({
          allowTipping: false,
          enableCoupon: false,
          enableLoyalty: false,
          redirectUrl:
            "https://site.test/checkout/confirmation?orderId=22222222-2222-4222-8222-222222222222",
        }),
        prePopulatedData: expect.objectContaining({
          buyerEmail: "guest@example.com",
          buyerPhoneNumber: "+14795550123",
        }),
      }),
      expect.any(Object),
    );
  });

  it("keeps delivery fee separate from the processing service charge", async () => {
    squareMocks.paymentLinkCreate.mockResolvedValue({
      paymentLink: {
        id: "link-delivery",
        orderId: "square-order-delivery",
        url: "https://sandbox.square.link/u/delivery",
      },
      relatedResources: {
        orders: [
          {
            ...pickupSquareOrder(),
            id: "square-order-delivery",
            serviceCharges: [
              {
                name: "Delivery fee",
                metadata: { fee_type: "delivery" },
                totalMoney: { amount: BigInt(500), currency: "USD" },
              },
              {
                name: "Processing fee",
                percentage: "2.5",
                totalMoney: { amount: BigInt(75), currency: "USD" },
              },
            ],
            totalMoney: { amount: BigInt(3325), currency: "USD" },
            totalServiceChargeMoney: { amount: BigInt(575), currency: "USD" },
          },
        ],
      },
    });

    const result = await SquarePaymentService.createCheckoutSession({
      order: makeOrder({
        fulfillment_type: "delivery",
        delivery_status: "approved_payment_needed",
        delivery_fee_cents: 500,
      }),
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(result.totals).toMatchObject({
      feeCents: 75,
      deliveryFeeCents: 500,
      totalCents: 3325,
    });
  });

  it("deletes a created link when configured tax is not applied", async () => {
    squareMocks.paymentLinkCreate.mockResolvedValue({
      paymentLink: {
        id: "link-1",
        orderId: "square-order-1",
        url: "https://sandbox.square.link/u/test",
      },
      relatedResources: {
        orders: [
          {
            ...pickupSquareOrder(),
            totalMoney: { amount: BigInt(2563), currency: "USD" },
            totalTaxMoney: { amount: BigInt(0), currency: "USD" },
          },
        ],
      },
    });
    squareMocks.paymentLinkDelete.mockResolvedValue({});

    await expect(
      SquarePaymentService.createCheckoutSession({
        order: makeOrder(),
        successUrl: "https://site.test/checkout/confirmation",
        cancelUrl: "https://site.test/order-tray",
      }),
    ).rejects.toMatchObject({ name: "PaymentTotalsError" });

    expect(squareMocks.paymentLinkDelete).toHaveBeenCalledWith({
      id: "link-1",
    });
  });

  it("fails closed when the processing fee percentage is missing", async () => {
    delete process.env.SQUARE_PROCESSING_FEE_PERCENT;

    await expect(
      SquarePaymentService.createCheckoutSession({
        order: makeOrder(),
        successUrl: "https://site.test/checkout/confirmation",
        cancelUrl: "https://site.test/order-tray",
      }),
    ).rejects.toMatchObject({ name: "PaymentConfigurationError" });

    expect(squareMocks.paymentLinkCreate).not.toHaveBeenCalled();
  });

  it("requires webhook configuration before production activation", () => {
    process.env.SQUARE_ENVIRONMENT = "production";
    delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    delete process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

    expect(() => SquarePaymentService.getConfiguration()).toThrow(
      "SQUARE_WEBHOOK_SIGNATURE_KEY is not configured.",
    );
  });

  it("requires the exact webhook URL before production activation", () => {
    process.env.SQUARE_ENVIRONMENT = "production";
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = "signature-key";
    delete process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

    expect(() => SquarePaymentService.getConfiguration()).toThrow(
      "SQUARE_WEBHOOK_NOTIFICATION_URL is not configured.",
    );
  });

  it("retrieves the configured Square location", async () => {
    squareMocks.locationGet.mockResolvedValue({
      location: {
        id: "location-1",
        name: "Default Test Account",
        status: "ACTIVE",
        currency: "USD",
      },
    });

    await expect(SquarePaymentService.getLocation()).resolves.toMatchObject({
      id: "location-1",
      status: "ACTIVE",
    });
    expect(squareMocks.locationGet).toHaveBeenCalledWith({
      locationId: "location-1",
    });
  });

  it("deletes Square Payment Links idempotently", async () => {
    squareMocks.paymentLinkDelete.mockResolvedValue({});

    await expect(
      SquarePaymentService.deleteCheckout("link-1"),
    ).resolves.toBeUndefined();
    expect(squareMocks.paymentLinkDelete).toHaveBeenCalledWith({
      id: "link-1",
    });
  });

  it("treats an already-deleted Square Payment Link as success", async () => {
    squareMocks.paymentLinkDelete.mockRejectedValue(
      new SquareError({ message: "Not found.", statusCode: 404 }),
    );

    await expect(
      SquarePaymentService.deleteCheckout("missing-link"),
    ).resolves.toBeUndefined();
  });

  it("retrieves authoritative Square Order totals", async () => {
    squareMocks.orderGet.mockResolvedValue({
      order: pickupSquareOrder(),
    });

    await expect(
      SquarePaymentService.getOrderTotals("square-order-1", 2500, 0),
    ).resolves.toMatchObject({
      subtotalCents: 2500,
      taxCents: 250,
      feeCents: 63,
      totalCents: 2813,
    });
    expect(squareMocks.orderGet).toHaveBeenCalledWith({
      orderId: "square-order-1",
    });
  });

  it("normalizes completed refunds", async () => {
    squareMocks.verifySignature.mockResolvedValue(true);

    await expect(
      SquarePaymentService.verifyAndNormalizeWebhook(
        JSON.stringify({
          type: "refund.updated",
          event_id: "refund-event-1",
          data: {
            object: {
              refund: {
                id: "refund-1",
                order_id: "square-order-1",
                payment_id: "payment-1",
                status: "COMPLETED",
                amount_money: { amount: 2813, currency: "USD" },
              },
            },
          },
        }),
        "signature",
      ),
    ).resolves.toMatchObject({
      refundId: "refund-1",
      refundedAmountCents: 2813,
      status: "refunded",
    });
  });

  it("fails closed when the Square location is missing", () => {
    delete process.env.SQUARE_LOCATION_ID;

    expect(() => SquarePaymentService.getConfiguration()).toThrow(
      "SQUARE_LOCATION_ID is not configured.",
    );
  });

  it("validates and normalizes Square payment webhooks", async () => {
    squareMocks.verifySignature.mockResolvedValue(true);

    await expect(
      SquarePaymentService.verifyAndNormalizeWebhook(
        JSON.stringify({
          type: "payment.updated",
          event_id: "event-1",
          data: {
            object: {
              payment: {
                id: "payment-1",
                order_id: "square-order-1",
                status: "COMPLETED",
                amount_money: { amount: 2813, currency: "USD" },
                total_money: { amount: 2813, currency: "USD" },
                refunded_money: { amount: 0, currency: "USD" },
              },
            },
          },
        }),
        "signature",
      ),
    ).resolves.toMatchObject({
      eventId: "event-1",
      providerOrderId: "square-order-1",
      paymentId: "payment-1",
      amountCents: 2813,
      status: "paid",
    });
  });

  it("rejects invalid Square webhook signatures", async () => {
    squareMocks.verifySignature.mockResolvedValue(false);

    await expect(
      SquarePaymentService.verifyAndNormalizeWebhook("{}", "bad-signature"),
    ).rejects.toMatchObject({ name: "PaymentWebhookSignatureError" });
  });
});
