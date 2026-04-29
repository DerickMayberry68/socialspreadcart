import { z } from "zod";

export const orderTrayItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  notes: z.string().max(500).optional().default(""),
  options: z.record(z.string(), z.unknown()).optional().default({}),
});

const fulfillmentAddressSchema = z.object({
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
  }),
});

export const orderTotalsSchema = z.object({
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  feeCents: z.number().int().nonnegative(),
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

export type CheckoutSubmissionInput = z.input<typeof checkoutSubmissionSchema>;
export type CheckoutSubmission = z.output<typeof checkoutSubmissionSchema>;
