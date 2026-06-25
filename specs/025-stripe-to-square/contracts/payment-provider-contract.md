# Payment Provider Contract

## Purpose

Keep `OrderService` independent from Square-specific response types while preserving limited legacy Stripe webhook compatibility.

## Provider Names

```ts
type PaymentProviderName = "square" | "stripe";
```

New checkout creation supports `square`. Stripe remains valid only for historical records and transition webhook normalization.

## Create Hosted Checkout

### Input

```ts
type CreateHostedCheckoutInput = {
  order: GuestOrderSummary;
  successUrl: string;
  cancelUrl: string;
};
```

### Output

```ts
type HostedCheckoutResult = {
  provider: "square";
  checkoutId: string;
  providerOrderId: string;
  paymentId: string | null;
  checkoutUrl: string;
  totals: {
    subtotalCents: number;
    taxCents: number;
    feeCents: number;
    deliveryFeeCents: number;
    totalCents: number;
    currency: string;
  };
};
```

Rules:

- Checkout creation is idempotent for the internal order/payment attempt.
- The output totals come from the created Square Order.
- Optional tipping is disabled.
- Missing configured tax/service-charge behavior raises `PaymentConfigurationError`.
- No credentials or raw provider response is returned to routes/components.

## Delete Hosted Checkout

### Input

```ts
type DeleteHostedCheckoutInput = {
  provider: "square";
  checkoutId: string;
};
```

### Result

- Success is idempotent.
- A previously deleted/not-found link is treated as already inactive.
- Provider failure prevents the internal delivery approval from being represented as safely invalidated unless the failure is explicitly recorded for retry.

## Verify And Normalize Webhook

### Input

```ts
type VerifyWebhookInput = {
  payload: string;
  signature: string;
};
```

### Normalized Output

```ts
type HostedPaymentEvent = {
  provider: "square" | "stripe";
  eventId: string;
  eventType: string;
  providerOrderId: string | null;
  checkoutId: string | null;
  paymentId: string | null;
  refundId: string | null;
  amountCents: number | null;
  refundedAmountCents: number | null;
  currency: string | null;
  status: PaymentStatus;
};
```

Rules:

- Signature validation occurs before JSON parsing is trusted.
- Tenant and internal order IDs are resolved from stored provider references.
- Provider payload tenant/customer metadata is not an authorization source.
- Unsupported valid event types normalize as ignored rather than returning a provider retry error.
