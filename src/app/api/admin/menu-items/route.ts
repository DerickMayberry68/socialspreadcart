import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { getSupabaseUser } from "@/lib/supabase/server";
import { MenuService } from "@/services/menu-service";

export async function POST(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const tenant = await getCurrentTenant();
  const body = await request.json().catch(() => null);
  const input = body && typeof body === "object" ? body : {};

  try {
    const item = await MenuService.createMenuItem({ ...input, tenantId: tenant.id });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid fields." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const tenant = await getCurrentTenant();
  const body = await request.json().catch(() => null);
  const input = body && typeof body === "object" ? body : {};

  try {
    const item = await MenuService.updateMenuItem({ ...input, tenantId: tenant.id });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid fields." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const tenant = await getCurrentTenant();
  const body = await request.json().catch(() => null);
  const id =
    typeof body === "object" && body !== null
      ? String((body as { id?: unknown }).id ?? "")
      : "";

  try {
    await MenuService.deleteMenuItem({ tenantId: tenant.id, id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Missing id." },
      { status: 400 },
    );
  }
}
