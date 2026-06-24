import { NextResponse } from "next/server";

import { OrderService } from "@/services/order-service";
import { PaymentService } from "@/services/payment-service";

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, message: "Missing Square signature." },
      { status: 400 },
    );
  }

  try {
    const payload = await request.text();
    const event = await PaymentService.constructSquareHostedCheckoutEvent(
      payload,
      signature,
    );

    if (event) {
      await OrderService.applySquareHostedCheckoutEvent(event);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const signatureError =
      error instanceof Error &&
      error.name === "PaymentWebhookSignatureError";

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Square webhook failed.",
      },
      { status: signatureError ? 403 : 500 },
    );
  }
}
