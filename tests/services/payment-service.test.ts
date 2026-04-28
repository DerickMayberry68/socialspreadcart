import { describe, expect, it, vi } from "vitest";

import { PaymentService } from "@/services/payment-service";

describe("PaymentService", () => {
  it("maps paid checkout session status to paid", () => {
    expect(
      PaymentService.paymentStatusFromCheckoutSession({
        payment_status: "paid",
      } as never),
    ).toBe("paid");
  });

  it("maps expired checkout sessions to cancelled", () => {
    expect(
      PaymentService.paymentStatusFromCheckoutSession({
        payment_status: "unpaid",
        status: "expired",
      } as never),
    ).toBe("cancelled");
  });

  it("rejects webhook verification when the signing secret is missing", async () => {
    const original = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    await expect(
      PaymentService.constructWebhookEvent("{}", "signature"),
    ).rejects.toThrow("STRIPE_WEBHOOK_SECRET is not configured.");

    process.env.STRIPE_WEBHOOK_SECRET = original;
  });
});
