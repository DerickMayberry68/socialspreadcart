import { z } from "zod";

export const orderTrayItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  notes: z.string().max(500).optional().default(""),
  options: z.record(z.string(), z.unknown()).optional().default({}),
});

export const fulfillmentAddressSchema = z.object({
  line1: z.string().trim().max(120).optional().or(z.literal("")),
  line2: z.string().trim().max(120).optional().or(z.literal("")).nullable(),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(40).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().length(2).optional().or(z.literal("")),
});

export const checkoutSubmissionSchema = z.object({
  tenantId: z.string().uuid(),
  items: z.array(orderTrayItemSchema).min(1),
  guest: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: z.string().trim().min(7).optional().or(z.literal("")),
  }).refine((guest) => Boolean(guest.email || guest.phone), {
    message: "Email or phone is required.",
    path: ["email"],
  }),
  fulfillment: z.object({
    type: z.enum(["pickup", "delivery", "event", "other"]).default("pickup"),
    requestedAt: z.string().optional().nullable(),
    notes: z.string().max(1000).optional().default(""),
    address: fulfillmentAddressSchema.optional(),
  }).superRefine((fulfillment, context) => {
    if (fulfillment.type !== "delivery" && fulfillment.type !== "event") return;

    const address = fulfillment.address;
    for (const field of ["line1", "city", "state", "postalCode"] as const) {
      if (!address?.[field]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Delivery and event orders require a fulfillment address for tax calculation.",
          path: ["address", field],
        });
      }
    }

    if (!fulfillment.requestedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Delivery requests require a requested date and time.",
        path: ["requestedAt"],
      });
    }
  }),
});

export const orderTotalsSchema = z.object({
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  feeCents: z.number().int().nonnegative(),
  deliveryFeeCents: z.number().int().nonnegative().default(0),
  totalCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  taxCalculationId: z.string().optional().nullable(),
});

export const checkoutConfirmSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
});

export const adminFulfillmentUpdateSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["paid", "preparing", "fulfilled", "cancelled"]),
});

export const adminDeliveryDecisionSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  adminUserId: z.string().uuid(),
  decision: z.enum(["approve", "decline", "offer_pickup", "withdraw_approval"]),
  note: z.string().trim().max(1000).optional().default(""),
  deliveryFeeCents: z.number().int().nonnegative().max(100000).optional().default(0),
  approvedFulfillmentRequestedAt: z.string().datetime().optional().nullable(),
  approvalExpiresAt: z.string().datetime().optional().nullable(),
}).superRefine((decision, context) => {
  if (
    (decision.decision === "decline" ||
      decision.decision === "offer_pickup" ||
      decision.decision === "withdraw_approval") &&
    !decision.note
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A customer-visible note is required for this decision.",
      path: ["note"],
    });
  }
});

export const deliveryPaymentSchema = z.object({
  tenantId: z.string().uuid(),
  orderId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const squareEnvironmentSchema = z.enum(["sandbox", "production"]);

export const squareProcessingFeePercentSchema = z.coerce
  .number()
  .positive()
  .max(100);

export const hostedPaymentEventSchema = z.object({
  provider: z.enum(["square", "stripe"]),
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  providerOrderId: z.string().min(1).nullable(),
  checkoutId: z.string().min(1).nullable(),
  paymentId: z.string().min(1).nullable(),
  refundId: z.string().min(1).nullable(),
  amountCents: z.number().int().nonnegative().nullable(),
  subtotalCents: z.number().int().nonnegative().nullable(),
  taxCents: z.number().int().nonnegative().nullable(),
  feeCents: z.number().int().nonnegative().nullable(),
  deliveryFeeCents: z.number().int().nonnegative().nullable(),
  refundedAmountCents: z.number().int().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
  status: z.enum([
    "not_started",
    "pending",
    "paid",
    "failed",
    "cancelled",
    "refunded",
  ]),
});

export type CheckoutSubmissionInput = z.input<typeof checkoutSubmissionSchema>;
export type CheckoutSubmission = z.output<typeof checkoutSubmissionSchema>;
