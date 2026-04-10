import { Resend } from "resend";

import type { QuoteRequest } from "@/lib/types";

export async function sendQuoteNotification(
  payload: QuoteRequest,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return;
  }

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
