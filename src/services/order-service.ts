import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { MenuItem } from "@/lib/types";
import type {
  CheckoutSessionResult,
  GuestOrder,
  GuestOrderSummary,
  OrderLineItem,
  OrderStatus,
  OrderTrayItem,
  PaymentRecord,
  PaymentStatus,
} from "@/lib/types/order";
import {
  adminFulfillmentUpdateSchema,
  checkoutConfirmSchema,
  checkoutSubmissionSchema,
} from "@/lib/validation/order";
import { PaymentService } from "@/services/payment-service";

const tenantIdSchema = z.string().uuid();

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

export function calculateOrderTotals(items: Array<Pick<OrderLineItem, "line_total_cents">>) {
  const subtotalCents = items.reduce((total, item) => total + item.line_total_cents, 0);
  return {
    subtotalCents,
    taxCents: 0,
    feeCents: 0,
    totalCents: subtotalCents,
    currency: "usd",
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

async function createCheckout(
  input: CreateCheckoutInput,
): Promise<CheckoutSessionResult> {
  const parsed = checkoutSubmissionSchema.parse(input);
  const supabase = getServiceClient();
  const orderItems = await buildOrderItems(parsed.tenantId, parsed.items, supabase);
  const totals = calculateOrderTotals(orderItems);

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
      subtotal_cents: totals.subtotalCents,
      tax_cents: totals.taxCents,
      fee_cents: totals.feeCents,
      total_cents: totals.totalCents,
      currency: totals.currency,
      status: "payment_pending",
      payment_status: "pending",
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
    currency: totals.currency,
    status: "pending",
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return {
    orderId: guestOrder.id,
    paymentStatus: "pending",
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
      currency: event.currency ?? existing?.currency ?? "usd",
      status,
      raw_event_id: event.eventId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenantId)
    .eq("order_id", event.orderId);

  if (paymentError) throw new Error(paymentError.message);

  const { error: orderError } = await supabase
    .from("guest_orders")
    .update({
      status: orderStatus,
      payment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", event.tenantId)
    .eq("id", event.orderId);

  if (orderError) throw new Error(orderError.message);
}

export const OrderService = {
  calculateOrderTotals,
  createCheckout,
  getCheckoutConfirmation,
  listOrders,
  updateFulfillmentStatus,
  applyHostedCheckoutEvent,
};
