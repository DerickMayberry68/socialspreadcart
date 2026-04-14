import { NextResponse } from "next/server";

import { getCurrentTenant } from "@/lib/tenant";
import { sendQuoteNotification } from "@/services/email-service";
import { submitQuote } from "@/services/quote-service";
import { hasSupabaseServiceEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, message: "Please complete all required fields." },
      { status: 400 },
    );
  }

  const tenant = await getCurrentTenant();
  const payload = { ...body, tenantId: tenant.id };

  const result = await submitQuote(payload);
  if (!result.ok) {
    console.error("[api/quote] submitQuote failed:", result.message);
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: result.status },
    );
  }

  await sendQuoteNotification(payload);

  return NextResponse.json({
    ok: true,
    message: hasSupabaseServiceEnv()
      ? "Quote submitted."
      : "Quote received in demo mode.",
  });
}
