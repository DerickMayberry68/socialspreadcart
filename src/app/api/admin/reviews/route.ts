import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { adminReviewQuerySchema } from "@/lib/validation/review";
import { ReviewService } from "@/services/review-service";

export async function GET(request: Request) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const { searchParams } = new URL(request.url);
  const query = adminReviewQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid review filter." },
      { status: 400 },
    );
  }

  try {
    const reviews = await ReviewService.listAdminReviews(
      guard.tenant.id,
      query.data.status,
    );

    return NextResponse.json({ ok: true, reviews });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Reviews could not be loaded.",
      },
      { status: 500 },
    );
  }
}
