import { z } from "zod";

export const orderTrayItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  notes: z.string().max(500).optional().default(""),
  options: z.record(z.string(), z.unknown()).optional().default({}),
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
  }),
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
