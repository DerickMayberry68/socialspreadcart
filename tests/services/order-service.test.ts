import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/services/payment-service", () => ({
  PaymentService: {
    assertOrderPaymentEligible: vi.fn(),
    calculateTax: vi.fn(),
    createCheckoutSession: vi.fn(),
    getPaymentProvider: vi.fn(() => "stripe"),
    getHostedCheckout: vi.fn(),
    deleteHostedCheckout: vi.fn(),
    getProviderOrderTotals: vi.fn(),
  },
}));

import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { OrderService } from "@/services/order-service";
import { PaymentService } from "@/services/payment-service";

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const ORDER_ID = "22222222-2222-4222-8222-222222222222";

const getServiceClientMock = vi.mocked(getSupabaseServiceRoleClient);
const calculateTaxMock = vi.mocked(PaymentService.calculateTax);
const paymentServiceMock = vi.mocked(PaymentService.createCheckoutSession);
const getPaymentProviderMock = vi.mocked(PaymentService.getPaymentProvider);
const assertPaymentEligibleMock = vi.mocked(
  PaymentService.assertOrderPaymentEligible,
);
const getHostedCheckoutMock = vi.mocked(PaymentService.getHostedCheckout);
const deleteHostedCheckoutMock = vi.mocked(PaymentService.deleteHostedCheckout);
const getProviderOrderTotalsMock = vi.mocked(
  PaymentService.getProviderOrderTotals,
);

type QueryClientOptions = {
  order: Record<string, unknown>;
  items?: unknown[];
  payment?: Record<string, unknown> | null;
  webhookInsertError?: { code: string; message: string } | null;
  webhookStatus?: "received" | "processed" | "ignored" | "failed" | null;
};

function makeQueryClient(options: QueryClientOptions) {
  const updates: Array<{
    table: string;
    values: Record<string, unknown>;
    filters: Record<string, unknown>;
  }> = [];
  const inserts: Array<{ table: string; values: unknown }> = [];
  let webhookStatus = options.webhookStatus ?? null;

  function from(table: string) {
    let operation: "select" | "insert" | "update" = "select";
    let values: unknown = null;
    let returning = false;
    const filters: Record<string, unknown> = {};

    const result = () => {
      if (operation === "insert") {
        if (table === "payment_webhook_events") {
          if (options.webhookInsertError) {
            return { data: null, error: options.webhookInsertError };
          }
          webhookStatus = "received";
        }
        return { data: null, error: null };
      }

      if (operation === "update") {
        if (table === "payment_webhook_events") {
          if (
            filters.processing_status === "failed" &&
            webhookStatus !== "failed"
          ) {
            return { data: null, error: null };
          }
          webhookStatus = String(
            (values as Record<string, unknown>).processing_status ??
              webhookStatus,
          ) as typeof webhookStatus;
        }
        return {
          data: returning ? { id: "updated-row" } : null,
          error: null,
        };
      }

      if (table === "guest_orders") {
        return { data: options.order, error: null };
      }
      if (table === "guest_order_items") {
        return { data: options.items ?? [], error: null };
      }
      if (table === "payment_records") {
        return { data: options.payment ?? null, error: null };
      }
      if (table === "payment_webhook_events") {
        return {
          data: webhookStatus
            ? { id: "webhook-row", processing_status: webhookStatus }
            : null,
          error: null,
        };
      }

      return { data: null, error: null };
    };

    const query = {
      select: vi.fn(() => {
        if (operation === "update") returning = true;
        return query;
      }),
      insert: vi.fn((nextValues: unknown) => {
        operation = "insert";
        values = nextValues;
        inserts.push({ table, values: nextValues });
        return query;
      }),
      update: vi.fn((nextValues: Record<string, unknown>) => {
        operation = "update";
        values = nextValues;
        updates.push({ table, values: nextValues, filters });
        return query;
      }),
      eq: vi.fn((column: string, value: unknown) => {
        filters[column] = value;
        return query;
      }),
      is: vi.fn((column: string, value: unknown) => {
        filters[column] = value;
        return query;
      }),
      in: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      maybeSingle: vi.fn(async () => result()),
      single: vi.fn(async () => result()),
      then: (
        resolve: (value: ReturnType<typeof result>) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result()).then(resolve, reject),
    };

    return query;
  }

  return {
    client: { from: vi.fn(from) },
    updates,
    inserts,
    getWebhookStatus: () => webhookStatus,
  };
}

function makeDeliveryOrder(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: ORDER_ID,
    tenant_id: TENANT_ID,
    guest_name: "Delivery Guest",
    guest_email: "delivery@example.com",
    guest_phone: null,
    fulfillment_type: "delivery",
    fulfillment_requested_at: "2026-06-25T18:00:00.000Z",
    fulfillment_notes: null,
    fulfillment_address: {
      line1: "100 Main St",
      city: "Bentonville",
      state: "AR",
      postalCode: "72712",
      country: "US",
    },
    delivery_status: "approved_payment_needed",
    delivery_fee_cents: 500,
    delivery_approval_expires_at: "2026-06-26T18:00:00.000Z",
    subtotal_cents: 2500,
    tax_cents: 0,
    fee_cents: 0,
    total_cents: 3000,
    currency: "usd",
    status: "delivery_approved_payment_needed",
    payment_status: "not_started",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function makeCheckoutClient(menuItems: unknown[]) {
  const menuQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: menuItems, error: null }),
  };
  const orderUpdateQuery = {
    eq: vi.fn().mockReturnThis(),
    then: (
      resolve: (value: { error: null }) => unknown,
    ) => Promise.resolve({ error: null }).then(resolve),
  };
  const orderQuery = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn(() => orderUpdateQuery),
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
        tax_cents: 200,
        fee_cents: 73,
        total_cents: 2773,
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
      if (table === "order_status_history") return insertOnlyQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { client, menuQuery, orderQuery, insertOnlyQuery };
}

describe("OrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TAX_ORIGIN_ADDRESS_LINE1 = "100 Main St";
    process.env.TAX_ORIGIN_ADDRESS_CITY = "Bentonville";
    process.env.TAX_ORIGIN_ADDRESS_STATE = "AR";
    process.env.TAX_ORIGIN_ADDRESS_POSTAL_CODE = "72712";
    calculateTaxMock.mockResolvedValue({
      taxCents: 200,
      taxCalculationId: "taxcalc_test",
    });
    getPaymentProviderMock.mockReturnValue("stripe");
    assertPaymentEligibleMock.mockImplementation(() => undefined);
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
      feeCents: 81,
      deliveryFeeCents: 0,
      totalCents: 3081,
      currency: "usd",
      taxCalculationId: undefined,
    });
  });

  it("calculates exact gross-up processing fees", () => {
    expect(OrderService.calculateProcessingFeeCents(2700)).toBe(73);
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
      checkoutId: "cs_test",
      providerOrderId: null,
      paymentId: "pi_test",
      checkoutUrl: "https://checkout.test",
      totals: {
        subtotalCents: 2500,
        taxCents: 200,
        feeCents: 73,
        deliveryFeeCents: 0,
        totalCents: 2773,
        currency: "usd",
        taxCalculationId: "taxcalc_test",
      },
    });

    const result = await OrderService.createCheckout({
      tenantId: TENANT_ID,
      items: [{ menuItemId: "menu-1", quantity: 1, notes: "No nuts" }],
      guest: { name: "Guest", email: "guest@example.com", phone: "" },
      fulfillment: { type: "pickup", requestedAt: null, notes: "" },
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(result.mode).toBe("payment");
    expect(result.mode === "payment" ? result.checkoutUrl : null).toBe("https://checkout.test");
    expect(result.totals).toEqual({
      subtotalCents: 2500,
      taxCents: 200,
      feeCents: 73,
      deliveryFeeCents: 0,
      totalCents: 2773,
      currency: "usd",
      taxCalculationId: "taxcalc_test",
    });
    expect(menuQuery.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
    expect(menuQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(orderQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        subtotal_cents: 2500,
        tax_cents: 200,
        fee_cents: 73,
        total_cents: 2773,
      }),
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

  it("persists Square-confirmed totals instead of the former local fee", async () => {
    delete process.env.TAX_ORIGIN_ADDRESS_LINE1;
    delete process.env.TAX_ORIGIN_ADDRESS_CITY;
    delete process.env.TAX_ORIGIN_ADDRESS_STATE;
    delete process.env.TAX_ORIGIN_ADDRESS_POSTAL_CODE;
    const { client, orderQuery } = makeCheckoutClient([
      {
        id: "menu-1",
        name: "Classic Tray",
        slug: "classic-tray",
        price_cents: 2500,
        is_active: true,
      },
    ]);
    getServiceClientMock.mockReturnValue(client as never);
    getPaymentProviderMock.mockReturnValue("square");
    calculateTaxMock.mockResolvedValue({
      taxCents: 0,
      taxCalculationId: null,
    });
    paymentServiceMock.mockResolvedValue({
      provider: "square",
      checkoutId: "link-1",
      providerOrderId: "square-order-1",
      paymentId: null,
      checkoutUrl: "https://sandbox.square.link/u/test",
      totals: {
        subtotalCents: 2500,
        taxCents: 250,
        feeCents: 63,
        deliveryFeeCents: 0,
        totalCents: 2813,
        currency: "usd",
        taxCalculationId: null,
      },
    });

    const result = await OrderService.createCheckout({
      tenantId: TENANT_ID,
      items: [{ menuItemId: "menu-1", quantity: 1, notes: "" }],
      guest: { name: "Guest", email: "guest@example.com", phone: "" },
      fulfillment: { type: "pickup", requestedAt: null, notes: "" },
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(orderQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        fee_cents: 0,
        total_cents: 2500,
      }),
    );
    expect(orderQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_cents: 250,
        fee_cents: 63,
        total_cents: 2813,
      }),
    );
    expect(result.totals).toMatchObject({
      taxCents: 250,
      feeCents: 63,
      totalCents: 2813,
    });
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
        subtotalCents: 2500,
        taxCents: 0,
        feeCents: 0,
        currency: "usd",
        status: "paid",
      },
    );

    expect(paymentLookup.select).toHaveBeenCalled();
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("creates an approved Square delivery checkout with a fixed delivery fee", async () => {
    const order = makeDeliveryOrder();
    const harness = makeQueryClient({
      order,
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
    });
    getServiceClientMock.mockReturnValue(harness.client as never);
    getPaymentProviderMock.mockReturnValue("square");
    paymentServiceMock.mockResolvedValue({
      provider: "square",
      checkoutId: "link-delivery",
      providerOrderId: "square-order-delivery",
      paymentId: null,
      checkoutUrl: "https://sandbox.square.link/u/delivery",
      totals: {
        subtotalCents: 2500,
        taxCents: 250,
        feeCents: 75,
        deliveryFeeCents: 500,
        totalCents: 3325,
        currency: "usd",
        taxCalculationId: null,
      },
    });

    const result = await OrderService.createDeliveryPayment({
      tenantId: TENANT_ID,
      orderId: ORDER_ID,
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(paymentServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.objectContaining({ delivery_fee_cents: 500 }),
      }),
    );
    expect(result).toMatchObject({
      checkoutUrl: "https://sandbox.square.link/u/delivery",
      totals: { deliveryFeeCents: 500, totalCents: 3325 },
    });
  });

  it("reuses an active Square delivery Payment Link", async () => {
    const payment = {
      id: "payment-1",
      tenant_id: TENANT_ID,
      order_id: ORDER_ID,
      provider: "square",
      provider_session_id: "link-delivery",
      provider_checkout_id: "link-delivery",
      provider_order_id: "square-order-delivery",
      provider_payment_intent_id: null,
      amount_cents: 3325,
      currency: "usd",
      status: "pending",
      created_at: "",
      updated_at: "",
    };
    const harness = makeQueryClient({
      order: makeDeliveryOrder({ payment_status: "pending" }),
      items: [],
      payment,
    });
    getServiceClientMock.mockReturnValue(harness.client as never);
    getPaymentProviderMock.mockReturnValue("square");
    getHostedCheckoutMock.mockResolvedValue({
      paymentLink: {
        id: "link-delivery",
        url: "https://sandbox.square.link/u/delivery",
      },
    } as never);

    const result = await OrderService.createDeliveryPayment({
      tenantId: TENANT_ID,
      orderId: ORDER_ID,
      successUrl: "https://site.test/checkout/confirmation",
      cancelUrl: "https://site.test/order-tray",
    });

    expect(result.checkoutUrl).toBe(
      "https://sandbox.square.link/u/delivery",
    );
    expect(paymentServiceMock).not.toHaveBeenCalled();
  });

  it("invalidates an expired Square link before rejecting delivery payment", async () => {
    const payment = {
      id: "payment-1",
      tenant_id: TENANT_ID,
      order_id: ORDER_ID,
      provider: "square",
      provider_session_id: "expired-link",
      provider_checkout_id: "expired-link",
      amount_cents: 3325,
      currency: "usd",
      status: "pending",
      created_at: "",
      updated_at: "",
    };
    const harness = makeQueryClient({
      order: makeDeliveryOrder({
        delivery_approval_expires_at: "2020-01-01T00:00:00.000Z",
        payment_status: "pending",
      }),
      payment,
    });
    getServiceClientMock.mockReturnValue(harness.client as never);
    assertPaymentEligibleMock.mockImplementation(() => {
      const error = new Error("This delivery approval has expired.");
      error.name = "OrderPaymentEligibilityError";
      throw error;
    });

    await expect(
      OrderService.createDeliveryPayment({
        tenantId: TENANT_ID,
        orderId: ORDER_ID,
        successUrl: "https://site.test/checkout/confirmation",
        cancelUrl: "https://site.test/order-tray",
      }),
    ).rejects.toMatchObject({ name: "OrderPaymentEligibilityError" });

    expect(deleteHostedCheckoutMock).toHaveBeenCalledWith({
      provider: "square",
      checkoutId: "expired-link",
    });
  });

  it("does not replace an active Stripe checkout with Square", async () => {
    const harness = makeQueryClient({
      order: makeDeliveryOrder({ payment_status: "pending" }),
      payment: {
        id: "payment-1",
        tenant_id: TENANT_ID,
        order_id: ORDER_ID,
        provider: "stripe",
        provider_session_id: "cs_active",
        amount_cents: 3325,
        currency: "usd",
        status: "pending",
        created_at: "",
        updated_at: "",
      },
    });
    getServiceClientMock.mockReturnValue(harness.client as never);
    getPaymentProviderMock.mockReturnValue("square");

    await expect(
      OrderService.createDeliveryPayment({
        tenantId: TENANT_ID,
        orderId: ORDER_ID,
        successUrl: "https://site.test/checkout/confirmation",
        cancelUrl: "https://site.test/order-tray",
      }),
    ).rejects.toMatchObject({ name: "OrderPaymentEligibilityError" });

    expect(paymentServiceMock).not.toHaveBeenCalled();
  });

  it("invalidates an active Square link before declining delivery", async () => {
    const harness = makeQueryClient({
      order: makeDeliveryOrder({ payment_status: "pending" }),
      payment: {
        id: "payment-1",
        tenant_id: TENANT_ID,
        order_id: ORDER_ID,
        provider: "square",
        provider_session_id: "link-delivery",
        provider_checkout_id: "link-delivery",
        amount_cents: 3325,
        currency: "usd",
        status: "pending",
        created_at: "",
        updated_at: "",
      },
    });
    getServiceClientMock.mockReturnValue(harness.client as never);

    await OrderService.decideDelivery({
      tenantId: TENANT_ID,
      orderId: ORDER_ID,
      adminUserId: "33333333-3333-4333-8333-333333333333",
      decision: "decline",
      note: "Delivery is unavailable for this date.",
    });

    expect(deleteHostedCheckoutMock).toHaveBeenCalledWith({
      provider: "square",
      checkoutId: "link-delivery",
    });
    expect(harness.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "guest_orders",
          values: expect.objectContaining({
            delivery_status: "declined",
          }),
        }),
      ]),
    );
  });

  it("reclaims failed Square events and completes payment without browser return", async () => {
    const payment = {
      id: "payment-1",
      tenant_id: TENANT_ID,
      order_id: ORDER_ID,
      provider: "square",
      provider_session_id: "link-1",
      provider_checkout_id: "link-1",
      provider_order_id: "square-order-1",
      provider_payment_intent_id: null,
      provider_refund_id: null,
      amount_cents: 2813,
      amount_subtotal_cents: 2500,
      amount_tax_cents: 250,
      amount_fee_cents: 63,
      refunded_amount_cents: 0,
      currency: "usd",
      status: "pending",
      created_at: "",
      updated_at: "",
    };
    const harness = makeQueryClient({
      order: {
        ...makeDeliveryOrder({
          fulfillment_type: "pickup",
          delivery_status: "not_required",
          delivery_fee_cents: 0,
          status: "payment_pending",
          payment_status: "pending",
          total_cents: 2813,
        }),
      },
      payment,
      webhookInsertError: {
        code: "23505",
        message: "duplicate key value",
      },
      webhookStatus: "failed",
    });
    getServiceClientMock.mockReturnValue(harness.client as never);
    getProviderOrderTotalsMock.mockResolvedValue({
      subtotalCents: 2500,
      taxCents: 250,
      feeCents: 63,
      deliveryFeeCents: 0,
      totalCents: 2813,
      currency: "usd",
      taxCalculationId: null,
    });

    await OrderService.applySquareHostedCheckoutEvent({
      provider: "square",
      eventId: "event-1",
      eventType: "payment.updated",
      providerOrderId: "square-order-1",
      checkoutId: null,
      paymentId: "square-payment-1",
      refundId: null,
      amountCents: 2813,
      subtotalCents: null,
      taxCents: null,
      feeCents: null,
      deliveryFeeCents: null,
      refundedAmountCents: 0,
      currency: "usd",
      status: "paid",
    });

    expect(harness.getWebhookStatus()).toBe("processed");
    expect(harness.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "payment_records",
          values: expect.objectContaining({ status: "paid" }),
        }),
        expect.objectContaining({
          table: "guest_orders",
          values: expect.objectContaining({
            status: "paid",
            payment_status: "paid",
          }),
        }),
      ]),
    );
  });

  it("reconciles a full Square refund while retaining the paid order status", async () => {
    const payment = {
      id: "payment-1",
      tenant_id: TENANT_ID,
      order_id: ORDER_ID,
      provider: "square",
      provider_session_id: "link-1",
      provider_checkout_id: "link-1",
      provider_order_id: "square-order-1",
      provider_payment_intent_id: "square-payment-1",
      provider_refund_id: null,
      amount_cents: 2813,
      amount_subtotal_cents: 2500,
      amount_tax_cents: 250,
      amount_fee_cents: 63,
      refunded_amount_cents: 0,
      currency: "usd",
      status: "paid",
      created_at: "",
      updated_at: "",
    };
    const harness = makeQueryClient({
      order: {
        ...makeDeliveryOrder({
          fulfillment_type: "pickup",
          delivery_status: "not_required",
          delivery_fee_cents: 0,
          status: "paid",
          payment_status: "paid",
          total_cents: 2813,
        }),
      },
      payment,
    });
    getServiceClientMock.mockReturnValue(harness.client as never);
    getProviderOrderTotalsMock.mockResolvedValue({
      subtotalCents: 2500,
      taxCents: 250,
      feeCents: 63,
      deliveryFeeCents: 0,
      totalCents: 2813,
      currency: "usd",
      taxCalculationId: null,
    });

    await OrderService.applySquareHostedCheckoutEvent({
      provider: "square",
      eventId: "refund-event-1",
      eventType: "refund.updated",
      providerOrderId: "square-order-1",
      checkoutId: null,
      paymentId: "square-payment-1",
      refundId: "refund-1",
      amountCents: null,
      subtotalCents: null,
      taxCents: null,
      feeCents: null,
      deliveryFeeCents: null,
      refundedAmountCents: 2813,
      currency: "usd",
      status: "refunded",
    });

    expect(harness.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "payment_records",
          values: expect.objectContaining({
            status: "refunded",
            refunded_amount_cents: 2813,
          }),
        }),
        expect.objectContaining({
          table: "guest_orders",
          values: expect.objectContaining({
            status: "paid",
            payment_status: "refunded",
          }),
        }),
      ]),
    );
  });

  it("rejects paid events for delivery orders that are no longer approved", async () => {
    const harness = makeQueryClient({
      order: makeDeliveryOrder({
        delivery_status: "declined",
        status: "delivery_declined",
      }),
      payment: {
        id: "payment-1",
        tenant_id: TENANT_ID,
        order_id: ORDER_ID,
        provider: "square",
        provider_order_id: "square-order-1",
        amount_cents: 3325,
        refunded_amount_cents: 0,
        currency: "usd",
        status: "pending",
        created_at: "",
        updated_at: "",
      },
    });
    getServiceClientMock.mockReturnValue(harness.client as never);

    await expect(
      OrderService.applySquareHostedCheckoutEvent({
        provider: "square",
        eventId: "event-declined",
        eventType: "payment.updated",
        providerOrderId: "square-order-1",
        checkoutId: null,
        paymentId: "square-payment-1",
        refundId: null,
        amountCents: 3325,
        subtotalCents: null,
        taxCents: null,
        feeCents: null,
        deliveryFeeCents: null,
        refundedAmountCents: 0,
        currency: "usd",
        status: "paid",
      }),
    ).rejects.toMatchObject({ name: "OrderStateError" });

    expect(harness.getWebhookStatus()).toBe("failed");
  });
});
