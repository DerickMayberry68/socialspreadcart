import { sendMail, type SendMailResult } from "@/lib/email/mailer";
import { renderBrandedEmail, type BrandedEmailRow } from "@/lib/email/templates";
import type { QuoteRequest, TenantRole } from "@/lib/types";

function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format((cents ?? 0) / 100);
}

/** Owner notification: a new quote request came in. */
export async function sendQuoteNotification(
  payload: QuoteRequest,
): Promise<SendMailResult> {
  const rows: BrandedEmailRow[] = [
    { label: "Name", value: payload.name },
    { label: "Email", value: payload.email },
    { label: "Phone", value: payload.phone },
    { label: "Event date", value: payload.eventDate },
    { label: "Event type", value: payload.eventType },
    { label: "Guests", value: payload.guests },
    { label: "Services", value: payload.services.join(", ") },
  ];
  if (payload.message) rows.push({ label: "Message", value: payload.message });

  const { html, text } = renderBrandedEmail({
    preheader: `New quote request from ${payload.name}`,
    heading: "New quote request",
    intro: [`You have a new quote request from ${payload.name}.`],
    rows,
  });

  return sendMail({
    context: "quote notification",
    to: process.env.QUOTE_NOTIFICATION_EMAIL,
    replyTo: payload.email, // replying reaches the customer
    subject: `New quote request from ${payload.name}`,
    html,
    text,
  });
}

/** Customer auto-reply: confirm we received their quote request. */
export async function sendQuoteConfirmation(
  payload: QuoteRequest,
): Promise<SendMailResult> {
  const rows: BrandedEmailRow[] = [
    { label: "Event date", value: payload.eventDate },
    { label: "Event type", value: payload.eventType },
    { label: "Guests", value: payload.guests },
    { label: "Services", value: payload.services.join(", ") },
  ];
  if (payload.message) rows.push({ label: "Message", value: payload.message });

  const { html, text } = renderBrandedEmail({
    preheader: "We received your quote request — Shayley will be in touch soon.",
    heading: "Thanks for your request!",
    intro: [
      `Hi ${payload.name},`,
      "Thanks for reaching out to The Social Spread Cart! We've received your quote request and Shayley will get back to you as soon as she can.",
      "Here's a summary of what you sent us:",
    ],
    rows,
    outro: ["If anything looks off, just reply to this email and it'll reach us."],
  });

  return sendMail({
    context: "quote confirmation",
    to: payload.email,
    replyTo: process.env.QUOTE_NOTIFICATION_EMAIL, // customer replies reach the owner
    subject: "We received your quote request — The Social Spread Cart",
    html,
    text,
  });
}

export interface OrderNotificationInput {
  orderId: string;
  tenantId: string;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  fulfillmentType: string;
  status: string;
  totalCents: number;
  currency: string;
  items: Array<{ name: string; quantity: number; lineTotalCents: number }>;
}

/** Owner notification: a new order was created (pickup or delivery request). */
export async function sendOrderNotification(
  order: OrderNotificationInput,
): Promise<SendMailResult> {
  const rows: BrandedEmailRow[] = [
    { label: "Order ID", value: order.orderId },
    { label: "Status", value: order.status },
    { label: "Name", value: order.guestName },
    { label: "Email", value: order.guestEmail ?? "—" },
    { label: "Phone", value: order.guestPhone ?? "—" },
    { label: "Fulfillment", value: order.fulfillmentType },
    ...order.items.map((item) => ({
      label: `${item.quantity} × ${item.name}`,
      value: formatMoney(item.lineTotalCents, order.currency),
    })),
    { label: "Total", value: formatMoney(order.totalCents, order.currency), emphasis: true },
  ];

  const { html, text } = renderBrandedEmail({
    preheader: `New ${order.fulfillmentType} order from ${order.guestName}`,
    heading: `New ${order.fulfillmentType} order`,
    intro: [`You have a new order from ${order.guestName}.`],
    rows,
  });

  return sendMail({
    context: "order notification",
    to: process.env.QUOTE_NOTIFICATION_EMAIL,
    replyTo: order.guestEmail ?? undefined,
    subject: `New ${order.fulfillmentType} order from ${order.guestName}`,
    html,
    text,
  });
}

export async function sendTenantInvitationEmail(input: {
  tenantName: string;
  email: string;
  role: TenantRole;
  acceptUrl: string;
}): Promise<SendMailResult> {
  const { html, text } = renderBrandedEmail({
    heading: `You're invited to join ${input.tenantName}`,
    intro: [
      `You've been invited to join ${input.tenantName} as ${input.role}.`,
    ],
    rows: [{ label: "Accept invitation", value: input.acceptUrl }],
    outro: ["This invitation expires in 7 days."],
  });

  return sendMail({
    context: "tenant invitation",
    to: input.email,
    subject: `You’ve been invited to join ${input.tenantName}`,
    html,
    text,
  });
}
