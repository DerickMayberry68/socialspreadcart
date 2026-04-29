import { NextResponse } from "next/server";

import { OrderService } from "@/services/order-service";
import { PaymentService } from "@/services/payment-service";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, message: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  try {
    const payload = await request.text();
    const event = await PaymentService.constructHostedCheckoutEvent(
      payload,
      signature,
    );
    await OrderService.applyHostedCheckoutEvent(event);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Webhook failed.",
      },
      { status: 400 },
    );
  }
}
