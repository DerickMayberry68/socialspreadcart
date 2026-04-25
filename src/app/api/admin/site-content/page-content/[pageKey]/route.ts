import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { MARKETING_PAGE_KEYS } from "@/lib/page-content-defaults";
import type { MarketingPageKey } from "@/lib/types/site-content";
import { SiteContentService } from "@/services/site-content-service";

function isMarketingPageKey(value: string): value is MarketingPageKey {
  return MARKETING_PAGE_KEYS.includes(value as MarketingPageKey);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageKey: string }> },
) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const { pageKey } = await params;
  if (!isMarketingPageKey(pageKey)) {
    return NextResponse.json(
      { ok: false, message: "Unsupported page content key." },
      { status: 404 },
    );
  }

  const record = await SiteContentService.getMarketingPageContent(
    guard.tenant.id,
    pageKey,
  );

  return NextResponse.json({ ok: true, ...record });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageKey: string }> },
) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const { pageKey } = await params;
  if (!isMarketingPageKey(pageKey)) {
    return NextResponse.json(
      { ok: false, message: "Unsupported page content key." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const content =
    body && typeof body === "object" && "content" in body
      ? (body as { content: unknown }).content
      : body;

  try {
    const record = await SiteContentService.updateMarketingPageContent(
      guard.tenant.id,
      guard.user.id,
      pageKey,
      content,
    );

    return NextResponse.json({ ok: true, ...record });
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
