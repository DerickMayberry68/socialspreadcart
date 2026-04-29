import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { ok: false, message: "orderId is required." },
      { status: 400 },
    );
  }

  const tenant = await getCurrentTenant();
  const order = await OrderService.getCheckoutConfirmation({
    tenantId: tenant.id,
    orderId,
  });

  if (!order) {
    return NextResponse.json({ ok: false, message: "Order not found." }, { status: 404 });
  }

  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { ok: false, message: "Payment has not completed.", order },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, order });
}
