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

    // Upsert contact by email (case-insensitive)
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .upsert(
        {
          name: payload.name,
          email: payload.email.toLowerCase(),
          phone: payload.phone,
          source: "quote",
        },
        { onConflict: "email", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (contactError) {
      return NextResponse.json(
        { ok: false, message: contactError.message },
        { status: 500 },
      );
    }

    const contactId = contactData?.id;

    // Insert quote linked to contact
    const { data: quoteData, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        contact_id: contactId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        event_date: payload.eventDate,
        event_type: payload.eventType,
        guests: payload.guests,
        services: payload.services,
        message: payload.message,
      })
      .select("id")
      .single();

    if (quoteError) {
      return NextResponse.json(
        { ok: false, message: quoteError.message },
        { status: 500 },
      );
    }

    // Log the interaction on the contact timeline
    if (contactId) {
      await supabase.from("interactions").insert({
        contact_id: contactId,
        type: "quote_submitted",
        body: `Quote #${quoteData?.id?.slice(0, 8)} — ${payload.eventType} for ${payload.guests} guests on ${payload.eventDate}. Services: ${payload.services.join(", ")}.`,
      });
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
