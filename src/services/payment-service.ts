import Stripe from "stripe";

import type {
  FulfillmentAddress,
  GuestOrderSummary,
  OrderLineItem,
  OrderTotals,
  PaymentStatus,
} from "@/lib/types/order";

export type PaymentProviderName = "stripe" | "chase";

type CheckoutSessionInput = {
  order: GuestOrderSummary;
  successUrl: string;
  cancelUrl: string;
};

type TaxCalculationInput = {
  items: OrderLineItem[];
  currency: string;
  fulfillmentAddress: FulfillmentAddress;
};

type CheckoutSessionOutput = {
  provider: PaymentProviderName;
  sessionId: string;
  paymentIntentId: string | null;
  checkoutUrl: string;
};

export type HostedCheckoutEvent = {
  provider: PaymentProviderName;
  id: string;
  eventId: string;
  orderId: string;
  tenantId: string;
  paymentIntentId: string | null;
  amountCents: number | null;
  subtotalCents: number | null;
  taxCents: number | null;
  feeCents: number | null;
  currency: string | null;
  status: PaymentStatus;
};

let stripeClient: Stripe | null = null;

const NON_TAXABLE_TAX_CODE = "txcd_00000000";

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

function getPaymentProvider(): PaymentProviderName {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase() || "disabled";

  if (provider === "disabled") {
    const error = new Error(
      "Online payments are not configured yet. Confirm Shayley's Chase payment product before enabling checkout payments.",
    );
    error.name = "PaymentConfigurationError";
    throw error;
  }

  if (provider === "chase") {
    const error = new Error(
      "PAYMENT_PROVIDER=chase is not implemented yet. Confirm Shayley's Chase product and gateway details first.",
    );
    error.name = "PaymentConfigurationError";
    throw error;
  }

  if (provider !== "stripe") {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  return "stripe";
}

async function createCheckoutSession({
  order,
  successUrl,
  cancelUrl,
}: CheckoutSessionInput): Promise<CheckoutSessionOutput> {
  const provider = getPaymentProvider();
  const stripe = getStripeClient();
  const success = new URL(successUrl);
  success.searchParams.set("orderId", order.id);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id,
    customer_email: order.guest_email ?? undefined,
    success_url: success.toString(),
    cancel_url: cancelUrl,
    metadata: {
      orderId: order.id,
      tenantId: order.tenant_id,
      subtotalCents: String(order.subtotal_cents),
      taxCents: String(order.tax_cents),
      feeCents: String(order.fee_cents),
    },
    line_items: buildCheckoutLineItems(order),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    provider,
    sessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    checkoutUrl: session.url,
  };
}

function buildCheckoutLineItems(order: GuestOrderSummary) {
  const menuTaxCode = process.env.STRIPE_MENU_ITEM_TAX_CODE;
  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: order.currency,
      unit_amount: item.unit_price_cents,
      product_data: {
        name: item.name,
        description: item.notes ?? undefined,
        ...(menuTaxCode ? { tax_code: menuTaxCode } : {}),
      },
    },
  }));

  if (order.tax_cents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: order.currency,
        unit_amount: order.tax_cents,
        product_data: {
          name: "Sales tax",
          description: "Calculated from configured tax rules.",
          tax_code: NON_TAXABLE_TAX_CODE,
        },
      },
    });
  }

  if (order.fee_cents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: order.currency,
        unit_amount: order.fee_cents,
        product_data: {
          name: "Processing fee",
          description: "Non-taxable card processing fee.",
          tax_code: NON_TAXABLE_TAX_CODE,
        },
      },
    });
  }

  return lineItems;
}

async function calculateTax({
  items,
  currency,
  fulfillmentAddress,
}: TaxCalculationInput): Promise<Pick<OrderTotals, "taxCents" | "taxCalculationId">> {
  const provider = getPaymentProvider();

  if (provider !== "stripe") {
    return { taxCents: 0, taxCalculationId: null };
  }

  const stripe = getStripeClient();
  const menuTaxCode = process.env.STRIPE_MENU_ITEM_TAX_CODE;
  const calculation = await stripe.tax.calculations.create({
    currency,
    customer_details: {
      address: {
        line1: fulfillmentAddress.line1 ?? undefined,
        line2: fulfillmentAddress.line2 ?? undefined,
        city: fulfillmentAddress.city ?? undefined,
        state: fulfillmentAddress.state ?? undefined,
        postal_code: fulfillmentAddress.postalCode ?? undefined,
        country: fulfillmentAddress.country ?? "US",
      },
      address_source: "shipping",
    },
    line_items: items.map((item) => ({
      amount: item.line_total_cents,
      quantity: item.quantity,
      reference: item.menu_item_id,
      tax_behavior: "exclusive",
      ...(menuTaxCode ? { tax_code: menuTaxCode } : {}),
    })),
  });

  return {
    taxCents: calculation.tax_amount_exclusive ?? 0,
    taxCalculationId: calculation.id,
  };
}

async function constructWebhookEvent(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return getStripeClient().webhooks.constructEvent(
    payload,
    signature,
    webhookSecret,
  );
}

async function constructHostedCheckoutEvent(
  payload: string,
  signature: string,
): Promise<HostedCheckoutEvent> {
  const event = await constructWebhookEvent(payload, signature);

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.expired"
  ) {
    throw new Error(`Unsupported payment event: ${event.type}`);
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  const tenantId = session.metadata?.tenantId;

  if (!orderId || !tenantId) {
    throw new Error("Payment event is missing order metadata.");
  }

  return {
    provider: "stripe",
    id: session.id,
    eventId: event.id,
    orderId,
    tenantId,
    paymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountCents: session.amount_total ?? null,
    subtotalCents: parsedMetadataCents(session.metadata?.subtotalCents) ?? session.amount_subtotal ?? null,
    taxCents: parsedMetadataCents(session.metadata?.taxCents) ?? session.total_details?.amount_tax ?? null,
    feeCents: parsedMetadataCents(session.metadata?.feeCents),
    currency: session.currency ?? null,
    status: paymentStatusFromCheckoutSession(session),
  };
}

function parsedMetadataCents(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function paymentStatusFromCheckoutSession(
  session: Stripe.Checkout.Session,
): PaymentStatus {
  if (session.payment_status === "paid") return "paid";
  if (session.status === "expired") return "cancelled";
  return "pending";
}

export const PaymentService = {
  calculateTax,
  createCheckoutSession,
  constructWebhookEvent,
  constructHostedCheckoutEvent,
  paymentStatusFromCheckoutSession,
};
