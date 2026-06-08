import { Resend } from "resend";

import { getResendMailConfig } from "@/lib/email/env";

export type SendMailResult = "sent" | "skipped" | "failed";

export interface SendMailInput {
  /** Recipient address. If empty/undefined, the send is skipped (never guessed). */
  to: string | null | undefined;
  subject: string;
  text: string;
  /** Optional label used in log lines to identify the kind of email. */
  context?: string;
}

/**
 * Sends a plain-text email via Resend.
 *
 * This function never throws to the caller: it returns a {@link SendMailResult}
 * and logs the outcome, so callers (e.g. the quote submission flow) cannot be
 * broken by a delivery failure or misconfiguration.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const label = input.context ?? "email";

  const config = getResendMailConfig();
  if (!config) {
    console.warn(`[email] ${label} skipped: Resend mail is not configured.`);
    return "skipped";
  }

  const recipient = input.to?.trim();
  if (!recipient) {
    console.warn(`[email] ${label} skipped: no recipient configured.`);
    return "skipped";
  }

  try {
    const resend = new Resend(config.apiKey);

    const { error } = await resend.emails.send({
      from: config.from,
      to: [recipient],
      subject: input.subject,
      text: input.text,
    });

    if (error) {
      console.error(`[email] ${label} failed:`, error);
      return "failed";
    }

    console.info(`[email] ${label} sent to ${recipient}.`);
    return "sent";
  } catch (error) {
    console.error(`[email] ${label} failed:`, error);
    return "failed";
  }
}
