import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";

function buildCheckoutUrls(request: Request) {
  const origin = new URL(request.url).origin;
  const successBase = process.env.CHECKOUT_SUCCESS_URL || `${origin}/checkout/confirmation`;
  const cancelUrl = process.env.CHECKOUT_CANCEL_URL || `${origin}/order-tray`;
  return { successUrl: successBase, cancelUrl };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "Please complete checkout details." },
      { status: 400 },
    );
  }

  const tenant = await getCurrentTenant();
  const { successUrl, cancelUrl } = buildCheckoutUrls(request);

  try {
    const result = await OrderService.createCheckout({
      ...body,
      tenantId: tenant.id,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout could not be started.";
    const status =
      error instanceof Error && error.name === "OrderReviewRequiredError"
        ? 409
        : error instanceof Error && error.name === "PaymentConfigurationError"
          ? 503
          : 400;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
