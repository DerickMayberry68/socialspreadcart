import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { OrderService } from "@/services/order-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const input = body && typeof body === "object" ? body : {};

  try {
    const order = await OrderService.decideDelivery({
      ...input,
      tenantId: guard.tenant.id,
      orderId: id,
      adminUserId: guard.user.id,
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delivery decision could not be saved.";
    const status =
      error instanceof Error && error.name === "OrderNotFoundError"
        ? 404
        : error instanceof Error && error.name === "OrderStateError"
          ? 409
          : 400;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
