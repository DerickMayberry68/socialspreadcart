import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { SiteContentService } from "@/services/site-content-service";

export async function GET() {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const config = await SiteContentService.getSiteConfiguration(guard.tenant.id);
  return NextResponse.json({ ok: true, config });
}

export async function PATCH(request: Request) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const body = await request.json().catch(() => null);
  try {
    const config = await SiteContentService.updateSiteConfiguration(
      guard.tenant.id,
      guard.user.id,
      body,
    );
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid fields.",
      },
      { status: 400 },
    );
  }
}
