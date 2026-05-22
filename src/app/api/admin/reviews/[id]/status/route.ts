import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { adminReviewStatusUpdateSchema } from "@/lib/validation/review";
import { ReviewService } from "@/services/review-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireTenantAdmin();
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    const payload = adminReviewStatusUpdateSchema.parse(
      body && typeof body === "object" ? body : {},
    );

    await ReviewService.moderateReview({
      tenantId: guard.tenant.id,
      reviewId: id,
      userId: guard.user.id,
      ...payload,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof ZodError
            ? "Invalid review moderation request."
            : error instanceof Error
              ? error.message
              : "Invalid review moderation request.",
      },
      { status: 400 },
    );
  }
}
