import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/services/payment-service", () => ({
  PaymentService: {
    createCheckoutSession: vi.fn(),
  },
}));

import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { OrderService } from "@/services/order-service";
import { PaymentService } from "@/services/payment-service";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";

const getServiceClientMock = vi.mocked(getSupabaseServiceRoleClient);
const paymentServiceMock = vi.mocked(PaymentService.createCheckoutSession);

function makeCheckoutClient(menuItems: unknown[]) {
  const menuQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: menuItems, error: null }),
  };
  const orderQuery = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: ORDER_ID,
        tenant_id: TENANT_ID,
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
      },
      error: null,
    }),
  };
  const insertOnlyQuery = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
  const client = {
    from: vi.fn((table: string) => {
      if (table === "menu_items") return menuQuery;
      if (table === "guest_orders") return orderQuery;
      if (table === "guest_order_items") return insertOnlyQuery;
      if (table === "payment_records") return insertOnlyQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { client, menuQuery, orderQuery, insertOnlyQuery };
}

describe("OrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates totals from order item snapshots", () => {
    expect(
      OrderService.calculateOrderTotals([
        { line_total_cents: 1200 },
        { line_total_cents: 1800 },
      ]),
    ).toEqual({
      subtotalCents: 3000,
      taxCents: 0,
      feeCents: 0,
      totalCents: 3000,
      currency: "usd",
    });
  });

  it("creates checkout with tenant-scoped menu lookup and item snapshots", async () => {
    const { client, menuQuery, orderQuery, insertOnlyQuery } = makeCheckoutClient([
      {
        id: "menu-1",
        name: "Classic Tray",
        slug: "classic-tray",
        price_cents: 2500,
        is_active: true,
      },
    ]);

    getServiceClientMock.mockReturnValue(client as never);
    paymentServiceMock.mockResolvedValue({
      provider: "stripe",
      sessionId: "cs_test",
      paymentIntentId: "pi_test",
      checkoutUrl: "https://checkout.test",
    });

    const result = await OrderService.createCheckout({
      tenantId: TENANT_ID,
      items: [{ menuItemId: "menu-1", quantity: 1, notes: "No nuts" }],
      guest: { name: "Guest", email: "guest@example.com", phone: "" },
      fulfillment: { type: "pickup", requestedAt: null, notes: "" },
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(result.checkoutUrl).toBe("https://checkout.test");
    expect(menuQuery.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
    expect(menuQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(orderQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID, total_cents: 2500 }),
    );
    expect(insertOnlyQuery.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          tenant_id: TENANT_ID,
          order_id: ORDER_ID,
          menu_item_id: "menu-1",
          notes: "No nuts",
        }),
      ]),
    );
  });

  it("requires review when a selected item is unavailable", async () => {
    const { client } = makeCheckoutClient([]);
    getServiceClientMock.mockReturnValue(client as never);

    await expect(
      OrderService.createCheckout({
        tenantId: TENANT_ID,
        items: [{ menuItemId: "missing", quantity: 1, notes: "" }],
        guest: { name: "Guest", email: "guest@example.com", phone: "" },
        fulfillment: { type: "pickup", requestedAt: null, notes: "" },
        successUrl: "https://site.test/checkout/confirmation",
        cancelUrl: "https://site.test/order-tray",
      }),
    ).rejects.toMatchObject({ name: "OrderReviewRequiredError" });
  });

  it("ignores duplicate payment webhook events", async () => {
    const paymentLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "payment-1",
          tenant_id: TENANT_ID,
          order_id: ORDER_ID,
          raw_event_id: "evt_1",
        },
        error: null,
      }),
    };
    const client = {
      from: vi.fn(() => paymentLookup),
    };

    getServiceClientMock.mockReturnValue(client as never);

    await OrderService.applyHostedCheckoutEvent(
      {
        provider: "stripe",
        id: "cs_test",
        eventId: "evt_1",
        orderId: ORDER_ID,
        tenantId: TENANT_ID,
        paymentIntentId: "pi_test",
        amountCents: 2500,
        currency: "usd",
        status: "paid",
      },
    );

    expect(paymentLookup.select).toHaveBeenCalled();
    expect(client.from).toHaveBeenCalledTimes(1);
  });
});
