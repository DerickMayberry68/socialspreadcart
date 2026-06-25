import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";

function buildCheckoutUrls(request: Request) {
  const origin = new URL(request.url).origin;
  const successUrl =
    process.env.CHECKOUT_SUCCESS_URL || `${origin}/checkout/confirmation`;
  const cancelUrl = process.env.CHECKOUT_CANCEL_URL || `${origin}/order-tray`;
  return { successUrl, cancelUrl };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "orderId is required." },
      { status: 400 },
    );
  }

  const tenant = await getCurrentTenant();
  const { successUrl, cancelUrl } = buildCheckoutUrls(request);

  try {
    const result = await OrderService.createDeliveryPayment({
      ...body,
      tenantId: tenant.id,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delivery payment could not be started.";
    const status =
      error instanceof Error && error.name === "OrderNotFoundError"
        ? 404
        : error instanceof Error && error.name === "OrderPaymentEligibilityError"
          ? 409
          : error instanceof Error && error.name === "PaymentConfigurationError"
            ? 503
            : error instanceof Error && error.name === "PaymentProviderError"
              ? 503
              : error instanceof Error && error.name === "PaymentTotalsError"
                ? 422
            : 400;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
