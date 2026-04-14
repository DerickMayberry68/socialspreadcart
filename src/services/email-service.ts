import { Resend } from "resend";

import type { QuoteRequest, TenantRole } from "@/lib/types";

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
      `Tenant ID: ${payload.tenantId}`,
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

export async function sendTenantInvitationEmail(input: {
  tenantName: string;
  email: string;
  role: TenantRole;
  acceptUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: [input.email],
    subject: `You’ve been invited to join ${input.tenantName}`,
    text: [
      `You’ve been invited to join ${input.tenantName} as ${input.role}.`,
      "",
      `Accept your invitation: ${input.acceptUrl}`,
      "",
      "This invitation expires in 7 days.",
    ].join("\n"),
  });
}
