import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  sessionCreate: vi.fn(),
  taxCreate: vi.fn(),
  constructEvent: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    checkout: {
      sessions: {
        create: stripeMocks.sessionCreate,
      },
    },
    tax: {
      calculations: {
        create: stripeMocks.taxCreate,
      },
    },
    webhooks: {
      constructEvent: stripeMocks.constructEvent,
    },
  })),
}));

import { PaymentService } from "@/services/payment-service";
import type { GuestOrderSummary, OrderLineItem } from "@/lib/types/order";

function makeItem(): OrderLineItem {
  return {
    menu_item_id: "menu-1",
    name: "Classic Tray",
    slug: "classic-tray",
    unit_price_cents: 2500,
    quantity: 1,
    line_total_cents: 2500,
    notes: null,
    options: {},
  };
}

function makeOrder(): GuestOrderSummary {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    tenant_id: "11111111-1111-4111-8111-111111111111",
    guest_name: "Guest",
    guest_email: "guest@example.com",
    guest_phone: null,
    fulfillment_type: "pickup",
    fulfillment_requested_at: null,
    fulfillment_notes: null,
    subtotal_cents: 2500,
    tax_cents: 200,
    fee_cents: 73,
    total_cents: 2773,
    currency: "usd",
    status: "payment_pending",
    payment_status: "pending",
    created_at: "",
    updated_at: "",
    items: [makeItem()],
    payment: null,
  };
}

describe("PaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    delete process.env.STRIPE_MENU_ITEM_TAX_CODE;
  });

  it("maps paid checkout session status to paid", () => {
    expect(
      PaymentService.paymentStatusFromCheckoutSession({
        payment_status: "paid",
      } as never),
    ).toBe("paid");
  });

  it("maps expired checkout sessions to cancelled", () => {
    expect(
      PaymentService.paymentStatusFromCheckoutSession({
        payment_status: "unpaid",
        status: "expired",
      } as never),
    ).toBe("cancelled");
  });

  it("rejects webhook verification when the signing secret is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    await expect(
      PaymentService.constructWebhookEvent("{}", "signature"),
    ).rejects.toThrow("STRIPE_WEBHOOK_SECRET is not configured.");
  });

  it("creates Stripe Tax Calculation requests from item snapshots and fulfillment address", async () => {
    stripeMocks.taxCreate.mockResolvedValue({
      id: "taxcalc_test",
      tax_amount_exclusive: 200,
    });

    await expect(
      PaymentService.calculateTax({
        items: [makeItem()],
        currency: "usd",
        fulfillmentAddress: {
          line1: "100 Main St",
          city: "Bentonville",
          state: "AR",
          postalCode: "72712",
          country: "US",
        },
      }),
    ).resolves.toEqual({ taxCents: 200, taxCalculationId: "taxcalc_test" });

    expect(stripeMocks.taxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "usd",
        line_items: [
          expect.objectContaining({
            amount: 2500,
            quantity: 1,
            reference: "menu-1",
            tax_behavior: "exclusive",
          }),
        ],
      }),
    );
  });

  it("creates checkout sessions with item, tax, and non-taxable processing fee lines", async () => {
    stripeMocks.sessionCreate.mockResolvedValue({
      id: "cs_test",
      payment_intent: "pi_test",
      url: "https://checkout.test",
    });

    await PaymentService.createCheckoutSession({
      order: makeOrder(),
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(stripeMocks.sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 2500,
            }),
          }),
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 200,
              product_data: expect.objectContaining({ name: "Sales tax" }),
            }),
          }),
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 73,
              product_data: expect.objectContaining({
                name: "Processing fee",
                tax_code: "txcd_00000000",
              }),
            }),
          }),
        ]),
      }),
    );
  });

  it("extracts provider totals from checkout webhooks", async () => {
    stripeMocks.constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          client_reference_id: "22222222-2222-4222-8222-222222222222",
          metadata: {
            tenantId: "11111111-1111-4111-8111-111111111111",
            subtotalCents: "2500",
            taxCents: "200",
            feeCents: "73",
          },
          payment_intent: "pi_test",
          amount_total: 2773,
          amount_subtotal: 2773,
          currency: "usd",
          payment_status: "paid",
        },
      },
    });

    await expect(
      PaymentService.constructHostedCheckoutEvent("{}", "signature"),
    ).resolves.toMatchObject({
      amountCents: 2773,
      subtotalCents: 2500,
      taxCents: 200,
      feeCents: 73,
      status: "paid",
    });
  });
});
