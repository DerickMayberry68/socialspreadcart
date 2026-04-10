import { NextResponse } from "next/server";
import { z } from "zod";

import { EVENT_TYPES, SERVICE_OPTIONS } from "@/types/booking";
import { sendQuoteNotification } from "@/services/email-service";
import { submitQuote } from "@/services/quote-service";
import { hasSupabaseServiceEnv } from "@/lib/supabase/env";

const quoteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventDate: z.string().min(1),
  eventType: z.enum(EVENT_TYPES),
  guests: z.string().min(1),
  services: z.array(z.enum(SERVICE_OPTIONS)).min(1),
  message: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please complete all required fields." },
      { status: 400 },
    );
  }

  const payload = parsed.data;

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
