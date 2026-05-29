import { NextResponse, type NextRequest } from "next/server";

import { normalizeAdminReturnUrl } from "@/lib/navigation/admin-return-url";
import { getSupabaseUser } from "@/lib/supabase/server";
import { setActiveTenantIdOnResponse } from "@/lib/tenant";
import { TenantService } from "@/services/tenant-service";

export async function GET(request: NextRequest) {
  const user = await getSupabaseUser();
  const returnUrl = normalizeAdminReturnUrl(
    request.nextUrl.searchParams.get("returnUrl"),
  );

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("returnUrl", "/choose-tenant");
    return NextResponse.redirect(loginUrl);
  }

  const memberships = (await TenantService.listMembershipsForUser(user.id)).filter(
    (membership) => membership.tenant?.status === "active",
  );

  if (memberships.length === 0) {
    return NextResponse.redirect(new URL("/awaiting-invitation", request.url));
  }

  if (memberships.length !== 1) {
    const chooseUrl = new URL("/choose-tenant", request.url);
    chooseUrl.searchParams.set("returnUrl", returnUrl);
    return NextResponse.redirect(chooseUrl);
  }

  const response = NextResponse.redirect(new URL(returnUrl, request.url));
  return setActiveTenantIdOnResponse(response, memberships[0].tenant_id);
}
