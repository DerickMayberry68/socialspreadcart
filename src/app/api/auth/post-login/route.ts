import { NextResponse } from "next/server";

import {
  clearActiveTenantIdOnResponse,
  setActiveTenantIdOnResponse,
} from "@/lib/tenant";
import { getSupabaseUser } from "@/lib/supabase/server";
import { TenantService } from "@/services/tenant-service";

export async function POST(request: Request) {
  const user = await getSupabaseUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const returnUrl =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { returnUrl?: unknown }).returnUrl === "string"
      ? (body as { returnUrl: string }).returnUrl
      : "/admin";

  const memberships = (await TenantService.listMembershipsForUser(user.id)).filter(
    (membership) => membership.tenant?.status === "active",
  );

  if (memberships.length === 0) {
    const response = NextResponse.json({
      ok: true,
      redirectTo: "/awaiting-invitation",
    });
    return clearActiveTenantIdOnResponse(response);
  }

  if (memberships.length === 1) {
    const response = NextResponse.json({
      ok: true,
      redirectTo: returnUrl,
    });
    return setActiveTenantIdOnResponse(response, memberships[0].tenant_id);
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: `/choose-tenant?returnUrl=${encodeURIComponent(returnUrl)}`,
  });
  return clearActiveTenantIdOnResponse(response);
}
