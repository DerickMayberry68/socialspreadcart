import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { OrderService } from "@/services/order-service";

export async function GET(request: Request) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const orders = await OrderService.listOrders(guard.tenant.id, status);

  return NextResponse.json({ ok: true, orders });
}

export async function PATCH(request: Request) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const body = await request.json().catch(() => null);
  const input = body && typeof body === "object" ? body : {};

  try {
    await OrderService.updateFulfillmentStatus({
      ...input,
      tenantId: guard.tenant.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid order update.",
      },
      { status: 400 },
    );
  }
}
