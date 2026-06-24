import Stripe from "stripe";

import type {
  FulfillmentAddress,
  GuestOrderSummary,
  HostedCheckoutResult,
  HostedPaymentEvent,
  OrderLineItem,
  OrderTotals,
  PaymentProviderName,
  PaymentStatus,
} from "@/lib/types/order";
import { SquarePaymentService } from "@/services/square-payment-service";

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
      "Online payments are not configured.",
    );
    error.name = "PaymentConfigurationError";
    throw error;
  }

  if (provider !== "stripe" && provider !== "square") {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  return provider;
}

async function createCheckoutSession({
  order,
  successUrl,
  cancelUrl,
}: CheckoutSessionInput): Promise<HostedCheckoutResult> {
  assertOrderPaymentEligible(order);
  const provider = getPaymentProvider();

  if (provider === "square") {
    return SquarePaymentService.createCheckoutSession({
      order,
      successUrl,
      cancelUrl,
    });
  }

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
      deliveryFeeCents: String(order.delivery_fee_cents ?? 0),
    },
    line_items: buildCheckoutLineItems(order),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    provider,
    checkoutId: session.id,
    providerOrderId: null,
    paymentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    checkoutUrl: session.url,
    totals: {
      subtotalCents: order.subtotal_cents,
      taxCents: order.tax_cents,
      feeCents: order.fee_cents,
      deliveryFeeCents: order.delivery_fee_cents ?? 0,
      totalCents: order.total_cents,
      currency: order.currency,
      taxCalculationId: order.payment?.tax_calculation_id ?? null,
    },
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

  if ((order.delivery_fee_cents ?? 0) > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: order.currency,
        unit_amount: order.delivery_fee_cents ?? 0,
        product_data: {
          name: "Delivery fee",
          description: "Approved delivery fee.",
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

function assertOrderPaymentEligible(order: GuestOrderSummary) {
  if (order.payment_status === "paid") {
    const error = new Error("This order has already been paid.");
    error.name = "OrderPaymentEligibilityError";
    throw error;
  }

  if (order.fulfillment_type !== "delivery") return;

  if (order.delivery_status !== "approved_payment_needed") {
    const error = new Error("Delivery must be approved before payment.");
    error.name = "OrderPaymentEligibilityError";
    throw error;
  }

  if (
    order.delivery_approval_expires_at &&
    new Date(order.delivery_approval_expires_at).getTime() <= Date.now()
  ) {
    const error = new Error("This delivery approval has expired.");
    error.name = "OrderPaymentEligibilityError";
    throw error;
  }
}

async function calculateTax({
  items,
  currency,
  fulfillmentAddress,
}: TaxCalculationInput): Promise<Pick<OrderTotals, "taxCents" | "taxCalculationId">> {
  const provider = getPaymentProvider();

  if (provider === "square") {
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

async function constructSquareHostedCheckoutEvent(
  payload: string,
  signature: string,
): Promise<HostedPaymentEvent | null> {
  return SquarePaymentService.verifyAndNormalizeWebhook(payload, signature);
}

async function deleteHostedCheckout(input: {
  provider: PaymentProviderName;
  checkoutId: string | null | undefined;
}) {
  if (!input.checkoutId) return;
  if (input.provider === "square") {
    await SquarePaymentService.deleteCheckout(input.checkoutId);
  }
}

async function getHostedCheckout(input: {
  provider: PaymentProviderName;
  checkoutId: string | null | undefined;
}) {
  if (input.provider !== "square" || !input.checkoutId) return null;
  return SquarePaymentService.getCheckout(input.checkoutId);
}

async function getProviderOrderTotals(input: {
  provider: PaymentProviderName;
  providerOrderId: string | null | undefined;
  subtotalCents: number;
  deliveryFeeCents: number;
}): Promise<OrderTotals | null> {
  if (input.provider !== "square" || !input.providerOrderId) return null;
  return SquarePaymentService.getOrderTotals(
    input.providerOrderId,
    input.subtotalCents,
    input.deliveryFeeCents,
  );
}

export const PaymentService = {
  assertOrderPaymentEligible,
  calculateTax,
  createCheckoutSession,
  constructWebhookEvent,
  constructHostedCheckoutEvent,
  constructSquareHostedCheckoutEvent,
  deleteHostedCheckout,
  getHostedCheckout,
  getPaymentProvider,
  getProviderOrderTotals,
  paymentStatusFromCheckoutSession,
  validateSquareLocation: SquarePaymentService.getLocation,
};
