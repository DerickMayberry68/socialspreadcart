import { sendMail, type SendMailResult } from "@/lib/email/mailer";
import type { QuoteRequest, TenantRole } from "@/lib/types";

export async function sendQuoteNotification(
  payload: QuoteRequest,
): Promise<SendMailResult> {
  return sendMail({
    context: "quote notification",
    // Owner recipient only. Never fall back to the requester's address.
    to: process.env.QUOTE_NOTIFICATION_EMAIL,
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
}): Promise<SendMailResult> {
  return sendMail({
    context: "tenant invitation",
    to: input.email,
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
