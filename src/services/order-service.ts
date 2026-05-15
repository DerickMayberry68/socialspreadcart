import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { MenuItem } from "@/lib/types";
import type {
  CheckoutSessionResult,
  FulfillmentAddress,
  GuestOrder,
  GuestOrderSummary,
  OrderLineItem,
  OrderTotals,
  OrderStatus,
  OrderTrayItem,
  PaymentRecord,
  PaymentStatus,
} from "@/lib/types/order";
import {
  adminDeliveryDecisionSchema,
  adminFulfillmentUpdateSchema,
  checkoutConfirmSchema,
  checkoutSubmissionSchema,
  deliveryPaymentSchema,
} from "@/lib/validation/order";
import { PaymentService } from "@/services/payment-service";

const tenantIdSchema = z.string().uuid();
const PROCESSING_FEE_RATE = 0.026;

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>;

type CreateCheckoutInput = z.input<typeof checkoutSubmissionSchema> & {
  successUrl: string;
  cancelUrl: string;
};

function getServiceClient(): SupabaseClient {
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Supabase service client is unavailable.");
  }

  return supabase as SupabaseClient;
}

function normalizeTrayItems(items: OrderTrayItem[]) {
  const byId = new Map<string, OrderTrayItem>();

  for (const item of items) {
    const current = byId.get(item.menuItemId);
    if (!current) {
      byId.set(item.menuItemId, item);
      continue;
    }

    byId.set(item.menuItemId, {
      ...current,
      quantity: current.quantity + item.quantity,
      notes: [current.notes, item.notes].filter(Boolean).join("; "),
      options: { ...current.options, ...item.options },
    });
  }

  return [...byId.values()];
}

export function calculateProcessingFeeCents(taxableTotalCents: number) {
  if (taxableTotalCents <= 0) return 0;
  return Math.ceil(taxableTotalCents / (1 - PROCESSING_FEE_RATE) - taxableTotalCents);
}

export function calculateOrderTotals(
  items: Array<Pick<OrderLineItem, "line_total_cents">>,
  taxCents = 0,
  deliveryFeeCents = 0,
  taxCalculationId?: string | null,
): OrderTotals {
  const subtotalCents = items.reduce((total, item) => total + item.line_total_cents, 0);
  const feeCents = calculateProcessingFeeCents(subtotalCents + taxCents + deliveryFeeCents);
  return {
    subtotalCents,
    taxCents,
    feeCents,
    deliveryFeeCents,
    totalCents: subtotalCents + taxCents + deliveryFeeCents + feeCents,
    currency: "usd",
    taxCalculationId,
  };
}

function getBusinessTaxAddress(): FulfillmentAddress {
  const address = {
    line1: process.env.TAX_ORIGIN_ADDRESS_LINE1,
    line2: process.env.TAX_ORIGIN_ADDRESS_LINE2,
    city: process.env.TAX_ORIGIN_ADDRESS_CITY,
    state: process.env.TAX_ORIGIN_ADDRESS_STATE,
    postalCode: process.env.TAX_ORIGIN_ADDRESS_POSTAL_CODE,
    country: process.env.TAX_ORIGIN_ADDRESS_COUNTRY || "US",
  };

  if (!address.line1 || !address.city || !address.state || !address.postalCode) {
    const error = new Error("Business tax address is not configured.");
    error.name = "TaxCalculationError";
    throw error;
  }

  return address;
}

function getFulfillmentTaxAddress(
  fulfillment: z.output<typeof checkoutSubmissionSchema>["fulfillment"],
): FulfillmentAddress {
  if (fulfillment.type === "pickup") return getBusinessTaxAddress();

  const address = fulfillment.address;
  if (!address?.line1 || !address.city || !address.state || !address.postalCode) {
    const error = new Error("Fulfillment address is required for tax calculation.");
    error.name = "TaxCalculationError";
    throw error;
  }

  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country || "US",
  };
}

async function buildOrderItems(
  tenantId: string,
  trayItems: OrderTrayItem[],
  supabase: SupabaseClient,
): Promise<OrderLineItem[]> {
  const normalized = normalizeTrayItems(trayItems);
  const menuIds = normalized.map((item) => item.menuItemId);

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .in("id", menuIds);

  if (error) {
    throw new Error(error.message);
  }

  const menuById = new Map((data as MenuItem[] | null ?? []).map((item) => [item.id, item]));
  const missing = menuIds.find((id) => !menuById.has(id));

  if (missing) {
    const error = new Error("One or more selected items are no longer available.");
    error.name = "OrderReviewRequiredError";
    throw error;
  }

  return normalized.map((item) => {
    const menuItem = menuById.get(item.menuItemId);
    if (!menuItem) {
      throw new Error("Selected item could not be found.");
    }

    return {
      menu_item_id: menuItem.id,
      name: menuItem.name,
      slug: menuItem.slug,
      unit_price_cents: menuItem.price_cents,
      quantity: item.quantity,
      line_total_cents: menuItem.price_cents * item.quantity,
      notes: item.notes?.trim() || null,
      options: item.options ?? {},
    };
  });
}

async function getOrderSummary(
  tenantId: string,
  orderId: string,
  supabase: SupabaseClient,
): Promise<GuestOrderSummary | null> {
  const { data: order, error } = await supabase
    .from("guest_orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!order) return null;

  const [{ data: items, error: itemsError }, { data: payment, error: paymentError }] =
    await Promise.all([
      supabase
        .from("guest_order_items")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
      supabase
        .from("payment_records")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("order_id", orderId)
        .maybeSingle(),
    ]);

  if (itemsError) throw new Error(itemsError.message);
  if (paymentError) throw new Error(paymentError.message);

  return {
    ...(order as GuestOrder),
    items: (items ?? []) as OrderLineItem[],
    payment: (payment as PaymentRecord | null) ?? null,
  };
}

async function recordStatusHistory(
  supabase: SupabaseClient,
  input: {
    tenantId: string;
    orderId: string;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    customerVisible?: boolean;
    createdBy?: string | null;
  },
) {
  const { error } = await supabase.from("order_status_history").insert({
    tenant_id: input.tenantId,
    order_id: input.orderId,
    event_type: input.eventType,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    note: input.note ?? null,
    customer_visible: input.customerVisible ?? false,
    created_by: input.createdBy ?? null,
  });

  if (error) throw new Error(error.message);
}

async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CheckoutSessionResult> {
  const parsed = checkoutSubmissionSchema.parse(input);
  const supabase = getServiceClient();
  const orderItems = await buildOrderItems(parsed.tenantId, parsed.items, supabase);
  const isDeliveryRequest = parsed.fulfillment.type === "delivery";
  const tax = isDeliveryRequest
    ? { taxCents: 0, taxCalculationId: null }
    : await PaymentService.calculateTax({
        items: orderItems,
        currency: "usd",
        fulfillmentAddress: getFulfillmentTaxAddress(parsed.fulfillment),
      });
  const totals = calculateOrderTotals(orderItems, tax.taxCents, 0, tax.taxCalculationId);

  const { data: order, error: orderError } = await supabase
    .from("guest_orders")
    .insert({
      tenant_id: parsed.tenantId,
      guest_name: parsed.guest.name,
      guest_email: parsed.guest.email || null,
      guest_phone: parsed.guest.phone || null,
      fulfillment_type: parsed.fulfillment.type,
      fulfillment_requested_at: parsed.fulfillment.requestedAt || null,
      fulfillment_notes: parsed.fulfillment.notes || null,
      fulfillment_address: parsed.fulfillment.address ?? null,
      subtotal_cents: totals.subtotalCents,
      tax_cents: totals.taxCents,
      fee_cents: totals.feeCents,
      delivery_fee_cents: totals.deliveryFeeCents,
      total_cents: totals.totalCents,
      currency: totals.currency,
      status: isDeliveryRequest ? "delivery_requested" : "payment_pending",
      payment_status: isDeliveryRequest ? "not_started" : "pending",
      delivery_status: isDeliveryRequest ? "requested" : "not_required",
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Failed to create order.");
  }

  const guestOrder = order as GuestOrder;
  const itemRows = orderItems.map((item) => ({
    tenant_id: parsed.tenantId,
    order_id: guestOrder.id,
    ...item,
  }));

  const { error: itemError } = await supabase
    .from("guest_order_items")
    .insert(itemRows);

  if (itemError) {
    throw new Error(itemError.message);
  }

  await recordStatusHistory(supabase, {
    tenantId: parsed.tenantId,
    orderId: guestOrder.id,
    eventType: isDeliveryRequest ? "delivery_requested" : "submitted",
    toStatus: guestOrder.status,
    customerVisible: isDeliveryRequest,
  });

  if (isDeliveryRequest) {
    return {
      mode: "delivery_request",
      orderId: guestOrder.id,
      status: "delivery_requested",
      deliveryStatus: "requested",
      paymentStatus: "not_started",
      message: "Delivery requested. Shayley will approve delivery before payment.",
      totals,
    };
  }

  const summary: GuestOrderSummary = {
    ...guestOrder,
    items: orderItems,
    payment: null,
  };

  const checkout = await PaymentService.createCheckoutSession({
    order: summary,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
  });

  const { error: paymentError } = await supabase.from("payment_records").insert({
    tenant_id: parsed.tenantId,
    order_id: guestOrder.id,
    provider: checkout.provider,
    provider_session_id: checkout.sessionId,
    provider_payment_intent_id: checkout.paymentIntentId,
    amount_cents: totals.totalCents,
    amount_subtotal_cents: totals.subtotalCents,
    amount_tax_cents: totals.taxCents,
    amount_fee_cents: totals.feeCents,
    currency: totals.currency,
    status: "pending",
    tax_calculation_id: totals.taxCalculationId ?? null,
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return {
    mode: "payment",
    orderId: guestOrder.id,
    paymentStatus: "pending",
    totals,
    checkoutUrl: checkout.checkoutUrl,
  };
}

function defaultApprovalExpiration() {
  const date = new Date();
  date.setHours(date.getHours() + 48);
  return date.toISOString();
}

async function decideDelivery(input: z.input<typeof adminDeliveryDecisionSchema>) {
  const parsed = adminDeliveryDecisionSchema.parse(input);
  const supabase = getServiceClient();
  const order = await getOrderSummary(parsed.tenantId, parsed.orderId, supabase);

  if (!order) {
    const error = new Error("Order not found.");
    error.name = "OrderNotFoundError";
    throw error;
  }

  if (order.fulfillment_type !== "delivery") {
    const error = new Error("Only delivery requests can receive delivery decisions.");
    error.name = "OrderStateError";
    throw error;
  }

  if (order.payment_status === "paid") {
    const error = new Error("Paid orders cannot receive delivery decisions.");
    error.name = "OrderStateError";
    throw error;
  }

  const now = new Date().toISOString();
  let update: Partial<GuestOrder> = {};
  let eventType = "";
  let customerVisible = true;

  if (parsed.decision === "approve") {
    if (
      order.delivery_status !== "requested" &&
      order.delivery_status !== "expired" &&
      order.delivery_status !== "approval_withdrawn"
    ) {
      const error = new Error("This delivery request is not ready for approval.");
      error.name = "OrderStateError";
      throw error;
    }

    const tax = await PaymentService.calculateTax({
      items: order.items,
      currency: order.currency,
      fulfillmentAddress: order.fulfillment_address ?? {},
    });
    const totals = calculateOrderTotals(
      order.items,
      tax.taxCents,
      parsed.deliveryFeeCents,
      tax.taxCalculationId,
    );

    update = {
      status: "delivery_approved_payment_needed",
      payment_status: "not_started",
      delivery_status: "approved_payment_needed",
      fulfillment_requested_at:
        parsed.approvedFulfillmentRequestedAt ?? order.fulfillment_requested_at,
      tax_cents: totals.taxCents,
      fee_cents: totals.feeCents,
      delivery_fee_cents: totals.deliveryFeeCents,
      total_cents: totals.totalCents,
      approved_total_cents: totals.totalCents,
      delivery_decision_note: parsed.note || "Delivery approved. Payment is needed to confirm the order.",
      delivery_approved_at: now,
      delivery_approval_expires_at: parsed.approvalExpiresAt ?? defaultApprovalExpiration(),
      delivery_decided_by: parsed.adminUserId,
      updated_at: now,
    };
    eventType = "delivery_approved";
  } else if (parsed.decision === "decline") {
    update = {
      status: "delivery_declined",
      delivery_status: "declined",
      payment_status: "not_started",
      delivery_decision_note: parsed.note,
      delivery_decided_by: parsed.adminUserId,
      updated_at: now,
    };
    eventType = "delivery_declined";
  } else if (parsed.decision === "offer_pickup") {
    update = {
      status: "pickup_offered",
      delivery_status: "pickup_offered",
      payment_status: "not_started",
      delivery_decision_note: parsed.note,
      delivery_decided_by: parsed.adminUserId,
      updated_at: now,
    };
    eventType = "pickup_offered";
  } else {
    if (order.delivery_status !== "approved_payment_needed") {
      const error = new Error("Only approved unpaid delivery requests can be withdrawn.");
      error.name = "OrderStateError";
      throw error;
    }
    update = {
      status: "approval_withdrawn",
      delivery_status: "approval_withdrawn",
      payment_status: "not_started",
      delivery_decision_note: parsed.note,
      delivery_decided_by: parsed.adminUserId,
      updated_at: now,
    };
    eventType = "approval_withdrawn";
  }

  const { error } = await supabase
    .from("guest_orders")
    .update(update)
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.orderId);

  if (error) throw new Error(error.message);

  await recordStatusHistory(supabase, {
    tenantId: parsed.tenantId,
    orderId: parsed.orderId,
    eventType,
    fromStatus: order.status,
    toStatus: update.status ?? null,
    note: parsed.note,
    customerVisible,
    createdBy: parsed.adminUserId,
  });

  return getOrderSummary(parsed.tenantId, parsed.orderId, supabase);
}

async function createDeliveryPayment(input: z.input<typeof deliveryPaymentSchema>) {
  const parsed = deliveryPaymentSchema.parse(input);
  const supabase = getServiceClient();
  const order = await getOrderSummary(parsed.tenantId, parsed.orderId, supabase);

  if (!order) {
    const error = new Error("Order not found.");
    error.name = "OrderNotFoundError";
    throw error;
  }

  PaymentService.assertOrderPaymentEligible(order);

  const checkout = await PaymentService.createCheckoutSession({
    order,
    successUrl: parsed.successUrl,
    cancelUrl: parsed.cancelUrl,
  });

  const { error: paymentError } = await supabase.from("payment_records").insert({
    tenant_id: parsed.tenantId,
    order_id: order.id,
    provider: checkout.provider,
    provider_session_id: checkout.sessionId,
    provider_payment_intent_id: checkout.paymentIntentId,
    amount_cents: order.total_cents,
    amount_subtotal_cents: order.subtotal_cents,
    amount_tax_cents: order.tax_cents,
    amount_fee_cents: order.fee_cents,
    currency: order.currency,
    status: "pending",
  });

  if (paymentError) throw new Error(paymentError.message);

  const { error: orderError } = await supabase
    .from("guest_orders")
    .update({
      payment_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", order.id);

  if (orderError) throw new Error(orderError.message);

  await recordStatusHistory(supabase, {
    tenantId: parsed.tenantId,
    orderId: order.id,
    eventType: "payment_started",
    fromStatus: order.status,
    toStatus: order.status,
    customerVisible: false,
  });

  return {
    mode: "payment" as const,
    orderId: order.id,
    paymentStatus: "pending" as const,
    totals: {
      subtotalCents: order.subtotal_cents,
      taxCents: order.tax_cents,
      feeCents: order.fee_cents,
      deliveryFeeCents: order.delivery_fee_cents ?? 0,
      totalCents: order.total_cents,
      currency: order.currency,
    },
    checkoutUrl: checkout.checkoutUrl,
  };
}

async function getCheckoutConfirmation(input: z.input<typeof checkoutConfirmSchema>) {
  const parsed = checkoutConfirmSchema.parse(input);
  return getOrderSummary(parsed.tenantId, parsed.orderId, getServiceClient());
}

async function listOrders(
  tenantId: string,
  status?: string,
): Promise<GuestOrderSummary[]> {
  tenantIdSchema.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) return [];

  let query = supabase
    .from("guest_orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: orders, error } = await query;

  if (error || !orders?.length) return [];

  const orderIds = (orders as GuestOrder[]).map((order) => order.id);
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("guest_order_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("order_id", orderIds),
    supabase
      .from("payment_records")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("order_id", orderIds),
  ]);

  return (orders as GuestOrder[]).map((order) => ({
    ...order,
    items: ((items ?? []) as OrderLineItem[]).filter(
      (item) => "order_id" in item && item.order_id === order.id,
    ),
    payment:
      ((payments ?? []) as PaymentRecord[]).find(
        (payment) => payment.order_id === order.id,
      ) ?? null,
  }));
}

async function updateFulfillmentStatus(
  input: z.input<typeof adminFulfillmentUpdateSchema>,
): Promise<void> {
  const parsed = adminFulfillmentUpdateSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { error } = await supabase
    .from("guest_orders")
    .update({
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.orderId);

  if (error) {
    throw new Error(error.message);
  }
}

async function applyHostedCheckoutEvent(
  event: Awaited<ReturnType<typeof PaymentService.constructHostedCheckoutEvent>>,
): Promise<void> {
  const supabase = getServiceClient();
  const { data: existingPayment, error: existingError } = await supabase
    .from("payment_records")
    .select("*")
    .eq("tenant_id", event.tenantId)
    .eq("order_id", event.orderId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const existing = existingPayment as PaymentRecord | null;
  if (existing?.raw_event_id === event.eventId) return;

  const status: PaymentStatus = event.status;

  const orderStatus: OrderStatus =
    status === "paid"
      ? "paid"
      : status === "cancelled"
        ? "payment_failed"
        : "payment_pending";

  const { error: paymentError } = await supabase
    .from("payment_records")
    .update({
      provider: event.provider,
      provider_session_id: event.id,
      provider_payment_intent_id: event.paymentIntentId,
      amount_cents: event.amountCents ?? existing?.amount_cents ?? 0,
      amount_subtotal_cents:
        event.subtotalCents ?? existing?.amount_subtotal_cents ?? null,
      amount_tax_cents: event.taxCents ?? existing?.amount_tax_cents ?? null,
      amount_fee_cents: event.feeCents ?? existing?.amount_fee_cents ?? null,
      currency: event.currency ?? existing?.currency ?? "usd",
      status,
      raw_event_id: event.eventId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenantId)
    .eq("order_id", event.orderId);

  if (paymentError) throw new Error(paymentError.message);

  const { data: orderBefore, error: orderLookupError } = await supabase
    .from("guest_orders")
    .select("*")
    .eq("tenant_id", event.tenantId)
    .eq("id", event.orderId)
    .maybeSingle();

  if (orderLookupError) throw new Error(orderLookupError.message);

  const currentOrder = orderBefore as GuestOrder | null;
  if (
    status === "paid" &&
    currentOrder?.fulfillment_type === "delivery" &&
    currentOrder.delivery_status !== "approved_payment_needed"
  ) {
    const error = new Error("Delivery order is not approved for payment.");
    error.name = "OrderStateError";
    throw error;
  }

  const { error: orderError } = await supabase
    .from("guest_orders")
    .update({
      status: orderStatus,
      payment_status: status,
      ...(status === "paid" && currentOrder?.fulfillment_type === "delivery"
        ? { delivery_status: "paid" }
        : {}),
      ...(event.subtotalCents !== null ? { subtotal_cents: event.subtotalCents } : {}),
      ...(event.taxCents !== null ? { tax_cents: event.taxCents } : {}),
      ...(event.feeCents !== null ? { fee_cents: event.feeCents } : {}),
      ...(event.amountCents !== null ? { total_cents: event.amountCents } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenantId)
    .eq("id", event.orderId);

  if (orderError) throw new Error(orderError.message);

  await recordStatusHistory(supabase, {
    tenantId: event.tenantId,
    orderId: event.orderId,
    eventType: status === "paid" ? "payment_paid" : "payment_failed",
    fromStatus: currentOrder?.status ?? null,
    toStatus: orderStatus,
    customerVisible: true,
  });
}

export const OrderService = {
  calculateProcessingFeeCents,
  calculateOrderTotals,
  createCheckout,
  getCheckoutConfirmation,
  listOrders,
  updateFulfillmentStatus,
  decideDelivery,
  createDeliveryPayment,
  applyHostedCheckoutEvent,
};
