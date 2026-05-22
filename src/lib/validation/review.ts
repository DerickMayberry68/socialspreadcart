import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const reviewStatusSchema = z.enum(["pending", "approved", "rejected", "hidden"]);

export const reviewSubmissionSchema = z.object({
  displayName: z.string().trim().min(2, "Name is required.").max(80, "Name is too long."),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5, "Choose a rating from 1 to 5."),
  reviewText: z
    .string()
    .trim()
    .min(12, "Please share a little more detail.")
    .max(1200, "Review is too long."),
  occasion: optionalTrimmedString(120),
  customerEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Enter a valid email.").max(160).optional(),
  ),
  customerPhone: optionalTrimmedString(40),
});

export const adminReviewQuerySchema = z.object({
  status: reviewStatusSchema.optional(),
});

export const adminReviewStatusUpdateSchema = z.object({
  status: reviewStatusSchema,
  adminNote: optionalTrimmedString(1000),
});

export type ReviewSubmissionInput = z.output<typeof reviewSubmissionSchema>;
export type AdminReviewStatusUpdateInput = z.output<typeof adminReviewStatusUpdateSchema>;
