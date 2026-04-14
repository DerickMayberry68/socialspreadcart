import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { getSupabaseUser } from "@/lib/supabase/server";
import { InteractionService } from "@/services/interaction-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const tenant = await getCurrentTenant();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const payload = body && typeof body === "object" ? body : {};

  try {
    const interaction = await InteractionService.createInteraction({
      ...payload,
      tenantId: tenant.id,
      contactId: id,
    });
    return NextResponse.json({ ok: true, interaction });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid fields." },
      { status: 400 },
    );
  }
}
