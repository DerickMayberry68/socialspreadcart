import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { hasSupabaseServiceEnv } from "@/lib/supabase/env";

const quoteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventDate: z.string().min(1),
  eventType: z.string().min(2),
  guests: z.string().min(1),
  services: z.array(z.string()).min(1),
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

  if (hasSupabaseServiceEnv()) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from("quotes").insert({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      event_date: payload.eventDate,
      event_type: payload.eventType,
      guests: payload.guests,
      services: payload.services,
      message: payload.message,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      );
    }
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [process.env.QUOTE_NOTIFICATION_EMAIL ?? payload.email],
      subject: `New quote request from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone}`,
        `Event Date: ${payload.eventDate}`,
        `Event Type: ${payload.eventType}`,
        `Guests: ${payload.guests}`,
        `Services: ${payload.services.join(", ")}`,
        `Message: ${payload.message}`,
      ].join("\n"),
    });
  }

  return NextResponse.json({
    ok: true,
    message: hasSupabaseServiceEnv()
      ? "Quote submitted."
      : "Quote received in demo mode.",
  });
}
