import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { SiteContentService } from "@/services/site-content-service";

export async function GET() {
  try {
    const guard = await requireTenantAdmin();
    if ("error" in guard) return guard.error;

    const content = await SiteContentService.loadAboutPageContent(
      guard.tenant.id,
    );

    return NextResponse.json({ ok: true, ...content });
  } catch (error) {
    console.error("About content load failed", error);
    return NextResponse.json(
      { ok: false, message: "Failed to load About content." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireTenantAdmin();
    if ("error" in guard) return guard.error;

    const body = await request.json().catch(() => null);
    const content = await SiteContentService.updateAboutContent(
      guard.tenant.id,
      guard.user.id,
      body,
    );

    return NextResponse.json({ ok: true, ...content });
  } catch (error) {
    console.error("About content update failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid fields.",
      },
      { status: 400 },
    );
  }
}
