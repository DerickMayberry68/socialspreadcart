import {
  SquareClient,
  SquareEnvironment,
  SquareError,
  WebhooksHelper,
  type Square,
} from "square";

import type {
  GuestOrderSummary,
  HostedCheckoutResult,
  HostedPaymentEvent,
  OrderTotals,
  PaymentStatus,
} from "@/lib/types/order";
import {
  hostedPaymentEventSchema,
  squareEnvironmentSchema,
  squareProcessingFeePercentSchema,
} from "@/lib/validation/order";

const DELIVERY_FEE_NAME = "Delivery fee";
const PROCESSING_FEE_LABEL = "Processing fee";

type SquareConfiguration = {
  environment: "sandbox" | "production";
  accessToken: string;
  locationId: string;
  processingFeePercent: number;
  webhookSignatureKey?: string;
  webhookNotificationUrl?: string;
};

let squareClient: SquareClient | null = null;
let squareClientKey: string | null = null;

function configurationError(message: string) {
  const error = new Error(message);
  error.name = "PaymentConfigurationError";
  return error;
}

function providerError(message: string) {
  const error = new Error(message);
  error.name = "PaymentProviderError";
  return error;
}

function orderTotalsError(message: string) {
  const error = new Error(message);
  error.name = "PaymentTotalsError";
  return error;
}

function getConfiguration(options: { requireWebhook?: boolean } = {}): SquareConfiguration {
  const environment = squareEnvironmentSchema.safeParse(
    process.env.SQUARE_ENVIRONMENT?.toLowerCase() || "sandbox",
  );
  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();
  const processingFeePercent = squareProcessingFeePercentSchema.safeParse(
    process.env.SQUARE_PROCESSING_FEE_PERCENT,
  );
  const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  const webhookNotificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim();

  if (!environment.success) {
    throw configurationError(
      "SQUARE_ENVIRONMENT must be either sandbox or production.",
    );
  }

  if (!accessToken) {
    throw configurationError("SQUARE_ACCESS_TOKEN is not configured.");
  }

  if (!locationId) {
    throw configurationError("SQUARE_LOCATION_ID is not configured.");
  }

  if (!processingFeePercent.success) {
    throw configurationError(
      "SQUARE_PROCESSING_FEE_PERCENT must be a positive percentage.",
    );
  }

  const webhookRequired =
    options.requireWebhook || environment.data === "production";

  if (webhookRequired && !webhookSignatureKey) {
    throw configurationError(
      "SQUARE_WEBHOOK_SIGNATURE_KEY is not configured.",
    );
  }

  if (webhookRequired && !webhookNotificationUrl) {
    throw configurationError(
      "SQUARE_WEBHOOK_NOTIFICATION_URL is not configured.",
    );
  }

  return {
    environment: environment.data,
    accessToken,
    locationId,
    processingFeePercent: processingFeePercent.data,
    webhookSignatureKey,
    webhookNotificationUrl,
  };
}

function getClient() {
  const configuration = getConfiguration();
  const key = `${configuration.environment}:${configuration.accessToken}`;

  if (!squareClient || squareClientKey !== key) {
    squareClient = new SquareClient({
      token: configuration.accessToken,
      environment:
        configuration.environment === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
    squareClientKey = key;
  }

  return squareClient;
}

function cents(money?: Square.Money | null) {
  if (money?.amount === undefined || money.amount === null) return 0;
  return Number(money.amount);
}

function currency(money?: Square.Money | null) {
  return money?.currency?.toLowerCase() || "usd";
}

function buildIdempotencyKey(order: GuestOrderSummary) {
  const version = order.updated_at
    ? Math.max(0, new Date(order.updated_at).getTime())
    : 0;
  return `ssc-${order.id}-${version}`;
}

function buildSuccessUrl(successUrl: string, orderId: string) {
  const success = new URL(successUrl);
  success.searchParams.set("orderId", orderId);
  return success.toString();
}

function buildBuyerAddress(order: GuestOrderSummary): Square.Address | undefined {
  const address = order.fulfillment_address;
  if (!address) return undefined;

  return {
    addressLine1: address.line1 || undefined,
    addressLine2: address.line2 || undefined,
    locality: address.city || undefined,
    administrativeDistrictLevel1: address.state || undefined,
    postalCode: address.postalCode || undefined,
    country: (address.country || "US").toUpperCase() as Square.Country,
  };
}

function buildSquareOrder(order: GuestOrderSummary): Square.Order {
  const configuration = getConfiguration();
  const serviceCharges: Square.OrderServiceCharge[] = [
    {
      uid: "processing-fee",
      name: PROCESSING_FEE_LABEL,
      percentage: String(configuration.processingFeePercent),
      calculationPhase: "SUBTOTAL_PHASE",
      taxable: false,
      scope: "ORDER",
      metadata: {
        fee_type: "processing",
      },
    },
  ];

  if ((order.delivery_fee_cents ?? 0) > 0) {
    serviceCharges.push({
      uid: "delivery-fee",
      name: DELIVERY_FEE_NAME,
      amountMoney: {
        amount: BigInt(order.delivery_fee_cents ?? 0),
        currency: "USD",
      },
      calculationPhase: "SUBTOTAL_PHASE",
      taxable: false,
      scope: "ORDER",
      metadata: {
        fee_type: "delivery",
      },
    });
  }

  return {
    locationId: configuration.locationId,
    referenceId: order.id,
    source: {
      name: "Social Spread Cart Website",
    },
    lineItems: order.items.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      note: item.notes || undefined,
      basePriceMoney: {
        amount: BigInt(item.unit_price_cents),
        currency: "USD",
      },
      metadata: {
        menu_item_id: item.menu_item_id,
        item_slug: item.slug,
      },
    })),
    serviceCharges,
    pricingOptions: {
      autoApplyTaxes: true,
      autoApplyDiscounts: false,
    },
    metadata: {
      internal_order_id: order.id,
      tenant_id: order.tenant_id,
    },
  };
}

function deliveryFeeFromOrder(order: Square.Order) {
  const deliveryCharge = order.serviceCharges?.find(
    (charge) =>
      charge.metadata?.fee_type === "delivery" ||
      charge.name?.toLowerCase() === DELIVERY_FEE_NAME.toLowerCase(),
  );
  return cents(deliveryCharge?.totalMoney ?? deliveryCharge?.appliedMoney);
}

function normalizeOrderTotals(
  squareOrder: Square.Order,
  expectedSubtotalCents: number,
  expectedDeliveryFeeCents: number,
): OrderTotals {
  const totalCents = cents(squareOrder.totalMoney);
  const taxCents = cents(squareOrder.totalTaxMoney);
  const totalServiceChargeCents = cents(squareOrder.totalServiceChargeMoney);
  const deliveryFeeCents = deliveryFeeFromOrder(squareOrder);
  const feeCents = Math.max(0, totalServiceChargeCents - deliveryFeeCents);
  const subtotalCents = expectedSubtotalCents;

  if (!squareOrder.id || totalCents <= 0) {
    throw orderTotalsError("Square did not return a payable order total.");
  }

  if (taxCents <= 0) {
    throw orderTotalsError(
      "Square did not apply the configured sales tax. Check the location tax settings for custom amounts.",
    );
  }

  if (feeCents <= 0) {
    throw orderTotalsError(
      "Square did not apply the configured online processing fee. Check Payment Link service-charge settings.",
    );
  }

  if (deliveryFeeCents !== expectedDeliveryFeeCents) {
    throw orderTotalsError(
      "Square returned a delivery fee that does not match the approved order.",
    );
  }

  if (
    subtotalCents + taxCents + feeCents + deliveryFeeCents !==
    totalCents
  ) {
    throw orderTotalsError(
      "Square returned an order total that does not match the itemized breakdown.",
    );
  }

  return {
    subtotalCents,
    taxCents,
    feeCents,
    deliveryFeeCents,
    totalCents,
    currency: currency(squareOrder.totalMoney),
    taxCalculationId: null,
  };
}

function formatSquareError(error: unknown) {
  if (error instanceof SquareError) {
    const details = error.errors
      ?.map((item) => item.detail || item.code)
      .filter(Boolean)
      .join(" ");
    return details || error.message;
  }

  return error instanceof Error ? error.message : "Square request failed.";
}

async function createCheckoutSession(input: {
  order: GuestOrderSummary;
  successUrl: string;
  cancelUrl: string;
}): Promise<HostedCheckoutResult> {
  const { order, successUrl } = input;
  const client = getClient();

  try {
    const response = await client.checkout.paymentLinks.create(
      {
        idempotencyKey: buildIdempotencyKey(order),
        description: `Social Spread Cart order ${order.id}`,
        order: buildSquareOrder(order),
        checkoutOptions: {
          allowTipping: false,
          redirectUrl: buildSuccessUrl(successUrl, order.id),
          askForShippingAddress: false,
          enableCoupon: false,
          enableLoyalty: false,
        },
        prePopulatedData: {
          buyerEmail: order.guest_email || undefined,
          buyerPhoneNumber: order.guest_phone || undefined,
          buyerAddress: buildBuyerAddress(order),
        },
        paymentNote: `Website order ${order.id}`,
      },
      {
        timeoutInSeconds: 15,
      },
    );

    const paymentLink = response.paymentLink;
    const squareOrder =
      response.relatedResources?.orders?.find(
        (candidate) => candidate.id === paymentLink?.orderId,
      ) ?? response.relatedResources?.orders?.[0];

    if (!paymentLink?.id || !paymentLink.url || !squareOrder?.id) {
      throw providerError(
        "Square did not return a complete hosted checkout link.",
      );
    }

    try {
      const totals = normalizeOrderTotals(
        squareOrder,
        order.subtotal_cents,
        order.delivery_fee_cents ?? 0,
      );

      return {
        provider: "square",
        checkoutId: paymentLink.id,
        providerOrderId: squareOrder.id,
        paymentId: null,
        checkoutUrl: paymentLink.url,
        totals,
      };
    } catch (error) {
      await client.checkout.paymentLinks
        .delete({ id: paymentLink.id })
        .catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "PaymentConfigurationError" ||
        error.name === "PaymentTotalsError" ||
        error.name === "PaymentProviderError")
    ) {
      throw error;
    }

    throw providerError(formatSquareError(error));
  }
}

async function deleteCheckout(checkoutId: string) {
  if (!checkoutId) return;

  try {
    await getClient().checkout.paymentLinks.delete({ id: checkoutId });
  } catch (error) {
    if (error instanceof SquareError && error.statusCode === 404) return;
    throw providerError(formatSquareError(error));
  }
}

async function getCheckout(checkoutId: string) {
  try {
    return await getClient().checkout.paymentLinks.get({ id: checkoutId });
  } catch (error) {
    if (error instanceof SquareError && error.statusCode === 404) return null;
    throw providerError(formatSquareError(error));
  }
}

async function getOrderTotals(
  providerOrderId: string,
  expectedSubtotalCents: number,
  expectedDeliveryFeeCents: number,
) {
  try {
    const response = await getClient().orders.get({
      orderId: providerOrderId,
    });

    if (!response.order) {
      throw providerError("Square order could not be found.");
    }

    return normalizeOrderTotals(
      response.order,
      expectedSubtotalCents,
      expectedDeliveryFeeCents,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "PaymentTotalsError" ||
        error.name === "PaymentProviderError")
    ) {
      throw error;
    }
    throw providerError(formatSquareError(error));
  }
}

async function getLocation() {
  const configuration = getConfiguration();
  try {
    const response = await getClient().locations.get({
      locationId: configuration.locationId,
    });

    if (!response.location?.id) {
      throw configurationError("Configured Square location could not be found.");
    }

    return response.location;
  } catch (error) {
    if (error instanceof Error && error.name === "PaymentConfigurationError") {
      throw error;
    }
    throw configurationError(formatSquareError(error));
  }
}

function paymentStatus(status?: string | null): PaymentStatus {
  if (status === "COMPLETED") return "paid";
  if (status === "FAILED") return "failed";
  if (status === "CANCELED") return "cancelled";
  return "pending";
}

async function verifyAndNormalizeWebhook(
  payload: string,
  signature: string,
): Promise<HostedPaymentEvent | null> {
  const configuration = getConfiguration({ requireWebhook: true });
  const isValid = await WebhooksHelper.verifySignature({
    requestBody: payload,
    signatureHeader: signature,
    signatureKey: configuration.webhookSignatureKey!,
    notificationUrl: configuration.webhookNotificationUrl!,
  });

  if (!isValid) {
    const error = new Error("Invalid Square signature.");
    error.name = "PaymentWebhookSignatureError";
    throw error;
  }

  const event = JSON.parse(payload) as {
    type?: string;
    event_id?: string;
    data?: {
      object?: {
        payment?: {
          id?: string;
          order_id?: string;
          status?: string;
          amount_money?: Square.Money;
          total_money?: Square.Money;
          refunded_money?: Square.Money;
        };
        refund?: {
          id?: string;
          order_id?: string;
          payment_id?: string;
          status?: string;
          amount_money?: Square.Money;
        };
      };
    };
  };

  if (event.type === "payment.updated") {
    const payment = event.data?.object?.payment;
    if (!event.event_id || !payment?.id) {
      throw providerError("Square payment event is missing required fields.");
    }

    const amountCents = cents(payment.amount_money);
    const refundedAmountCents = cents(payment.refunded_money);
    const status =
      payment.status === "COMPLETED" &&
      amountCents > 0 &&
      refundedAmountCents >= amountCents
        ? "refunded"
        : paymentStatus(payment.status);

    return hostedPaymentEventSchema.parse({
      provider: "square",
      eventId: event.event_id,
      eventType: event.type,
      providerOrderId: payment.order_id ?? null,
      checkoutId: null,
      paymentId: payment.id,
      refundId: null,
      amountCents: cents(payment.total_money ?? payment.amount_money),
      subtotalCents: null,
      taxCents: null,
      feeCents: null,
      deliveryFeeCents: null,
      refundedAmountCents,
      currency: currency(payment.total_money ?? payment.amount_money),
      status,
    });
  }

  if (event.type === "refund.updated") {
    const refund = event.data?.object?.refund;
    if (!event.event_id || !refund?.id) {
      throw providerError("Square refund event is missing required fields.");
    }

    return hostedPaymentEventSchema.parse({
      provider: "square",
      eventId: event.event_id,
      eventType: event.type,
      providerOrderId: refund.order_id ?? null,
      checkoutId: null,
      paymentId: refund.payment_id ?? null,
      refundId: refund.id,
      amountCents: null,
      subtotalCents: null,
      taxCents: null,
      feeCents: null,
      deliveryFeeCents: null,
      refundedAmountCents:
        refund.status === "COMPLETED" ? cents(refund.amount_money) : null,
      currency: currency(refund.amount_money),
      status: refund.status === "COMPLETED" ? "refunded" : "pending",
    });
  }

  return null;
}

export const SquarePaymentService = {
  createCheckoutSession,
  deleteCheckout,
  getCheckout,
  getConfiguration,
  getLocation,
  getOrderTotals,
  normalizeOrderTotals,
  paymentStatus,
  verifyAndNormalizeWebhook,
};
