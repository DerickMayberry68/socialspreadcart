import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentTenant } from "@/lib/tenant";
import { reviewSubmissionSchema } from "@/lib/validation/review";
import { ReviewService } from "@/services/review-service";

export async function GET() {
  const tenant = await getCurrentTenant();
  const reviews = await ReviewService.listApprovedReviews(tenant.id);

  return NextResponse.json({ ok: true, reviews });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "Please complete the required review fields." },
      { status: 400 },
    );
  }

  try {
    const tenant = await getCurrentTenant();
    const payload = reviewSubmissionSchema.parse(body);

    await ReviewService.createPendingReview({
      ...payload,
      tenantId: tenant.id,
      source: "floating_cta",
    });

    return NextResponse.json({
      ok: true,
      message: "Review submitted for approval.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: "Please complete the required review fields.",
          fieldErrors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Review could not be submitted right now.",
      },
      { status: error instanceof Error && error.name === "DuplicateReviewError" ? 409 : 500 },
    );
  }
}
