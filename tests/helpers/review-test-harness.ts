import type { CustomerReview } from "@/lib/types";

export function buildCustomerReview(
  overrides: Partial<CustomerReview> = {},
): CustomerReview {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    tenant_id: "11111111-1111-4111-8111-111111111111",
    display_name: "Avery M.",
    rating: 5,
    review_text: "The cart was the best part of the event.",
    occasion: "Shower",
    customer_email: "avery@example.com",
    customer_phone: null,
    status: "pending",
    source: "floating_cta",
    admin_note: null,
    submitted_at: "2026-05-22T18:00:00.000Z",
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    hidden_at: null,
    hidden_by: null,
    created_at: "2026-05-22T18:00:00.000Z",
    updated_at: "2026-05-22T18:00:00.000Z",
    ...overrides,
  };
}
