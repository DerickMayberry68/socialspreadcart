import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/payment-service", () => ({
  PaymentService: {
    constructSquareHostedCheckoutEvent: vi.fn(),
  },
}));

vi.mock("@/services/order-service", () => ({
  OrderService: {
    applySquareHostedCheckoutEvent: vi.fn(),
  },
}));

import { POST } from "@/app/api/webhooks/square/route";
import { OrderService } from "@/services/order-service";
import { PaymentService } from "@/services/payment-service";

const constructEventMock = vi.mocked(
  PaymentService.constructSquareHostedCheckoutEvent,
);
const applyEventMock = vi.mocked(OrderService.applySquareHostedCheckoutEvent);

function request(signature = "signature") {
  return new Request("https://site.test/api/webhooks/square", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-square-hmacsha256-signature": signature,
    },
    body: JSON.stringify({ type: "payment.updated", event_id: "event-1" }),
  });
}

describe("POST /api/webhooks/square", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a signature", async () => {
    const response = await POST(
      new Request("https://site.test/api/webhooks/square", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("rejects invalid signatures", async () => {
    const error = new Error("Invalid Square signature.");
    error.name = "PaymentWebhookSignatureError";
    constructEventMock.mockRejectedValue(error);

    const response = await POST(request("invalid"));

    expect(response.status).toBe(403);
    expect(applyEventMock).not.toHaveBeenCalled();
  });

  it("acknowledges unsupported signed events", async () => {
    constructEventMock.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(applyEventMock).not.toHaveBeenCalled();
  });

  it("returns a retryable response for malformed signed payloads", async () => {
    constructEventMock.mockRejectedValue(new SyntaxError("Invalid JSON."));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(applyEventMock).not.toHaveBeenCalled();
  });

  it("applies normalized events and acknowledges duplicates", async () => {
    const event = {
      provider: "square" as const,
      eventId: "event-1",
      eventType: "payment.updated",
      providerOrderId: "square-order-1",
      checkoutId: null,
      paymentId: "payment-1",
      refundId: null,
      amountCents: 2813,
      subtotalCents: null,
      taxCents: null,
      feeCents: null,
      deliveryFeeCents: null,
      refundedAmountCents: 0,
      currency: "usd",
      status: "paid" as const,
    };
    constructEventMock.mockResolvedValue(event);
    applyEventMock.mockResolvedValue();

    const first = await POST(request());
    const replay = await POST(request());

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(applyEventMock).toHaveBeenCalledTimes(2);
  });

  it("returns a retryable response when reconciliation fails", async () => {
    constructEventMock.mockResolvedValue({
      provider: "square",
      eventId: "event-1",
      eventType: "payment.updated",
      providerOrderId: "square-order-1",
      checkoutId: null,
      paymentId: "payment-1",
      refundId: null,
      amountCents: 2813,
      subtotalCents: null,
      taxCents: null,
      feeCents: null,
      deliveryFeeCents: null,
      refundedAmountCents: 0,
      currency: "usd",
      status: "paid",
    });
    applyEventMock.mockRejectedValue(new Error("Database unavailable."));

    const response = await POST(request());

    expect(response.status).toBe(500);
  });
});
