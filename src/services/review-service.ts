import { z } from "zod";

import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type {
  CustomerReview,
  CustomerReviewStatus,
  PublicCustomerReview,
} from "@/lib/types";
import {
  adminReviewStatusUpdateSchema,
  reviewStatusSchema,
  reviewSubmissionSchema,
  type AdminReviewStatusUpdateInput,
  type ReviewSubmissionInput,
} from "@/lib/validation/review";

const tenantIdSchema = z.string().uuid();
const reviewIdSchema = z.string().uuid();

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>;

type CreatePendingReviewInput = ReviewSubmissionInput & {
  tenantId: string;
  source?: string;
};

type ModerateReviewInput = AdminReviewStatusUpdateInput & {
  tenantId: string;
  reviewId: string;
  userId: string;
};

function getServiceClient(): SupabaseClient {
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    throw new Error("Review storage is unavailable.");
  }

  return supabase as SupabaseClient;
}

function toPublicReview(review: CustomerReview): PublicCustomerReview {
  return {
    id: review.id,
    display_name: review.display_name,
    rating: review.rating,
    review_text: review.review_text,
    occasion: review.occasion ?? null,
    approved_at: review.approved_at ?? null,
  };
}

async function createPendingReview(input: CreatePendingReviewInput): Promise<CustomerReview> {
  const tenantId = tenantIdSchema.parse(input.tenantId);
  const payload = reviewSubmissionSchema.parse(input);
  const supabase = getServiceClient();

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: duplicate, error: duplicateError } = await supabase
    .from("customer_reviews")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("display_name", payload.displayName)
    .eq("review_text", payload.reviewText)
    .gte("submitted_at", since)
    .maybeSingle();

  if (duplicateError) {
    throw new Error(duplicateError.message);
  }

  if (duplicate) {
    const error = new Error("This review was already submitted recently.");
    error.name = "DuplicateReviewError";
    throw error;
  }

  const { data, error } = await supabase
    .from("customer_reviews")
    .insert({
      tenant_id: tenantId,
      display_name: payload.displayName,
      rating: payload.rating,
      review_text: payload.reviewText,
      occasion: payload.occasion ?? null,
      customer_email: payload.customerEmail ?? null,
      customer_phone: payload.customerPhone ?? null,
      status: "pending",
      source: input.source ?? "floating_cta",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Review could not be submitted.");
  }

  return data as CustomerReview;
}

async function listApprovedReviews(tenantIdInput: string): Promise<PublicCustomerReview[]> {
  const tenantId = tenantIdSchema.parse(tenantIdInput);
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("customer_reviews")
    .select("id, display_name, rating, review_text, occasion, approved_at, tenant_id, status, source, submitted_at, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(12);

  if (error || !data) {
    return [];
  }

  return (data as CustomerReview[]).map(toPublicReview);
}

async function listAdminReviews(
  tenantIdInput: string,
  statusInput?: CustomerReviewStatus,
): Promise<CustomerReview[]> {
  const tenantId = tenantIdSchema.parse(tenantIdInput);
  const status = statusInput ? reviewStatusSchema.parse(statusInput) : undefined;
  const supabase = getServiceClient();

  let query = supabase
    .from("customer_reviews")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("submitted_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CustomerReview[];
}

async function moderateReview(input: ModerateReviewInput): Promise<void> {
  const tenantId = tenantIdSchema.parse(input.tenantId);
  const reviewId = reviewIdSchema.parse(input.reviewId);
  const payload = adminReviewStatusUpdateSchema.parse(input);
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const update: Partial<CustomerReview> = {
    status: payload.status,
    admin_note: payload.adminNote ?? null,
  };

  if (payload.status === "approved") {
    update.approved_at = now;
    update.approved_by = input.userId;
    update.rejected_at = null;
    update.rejected_by = null;
    update.hidden_at = null;
    update.hidden_by = null;
  }

  if (payload.status === "rejected") {
    update.rejected_at = now;
    update.rejected_by = input.userId;
  }

  if (payload.status === "hidden") {
    update.hidden_at = now;
    update.hidden_by = input.userId;
  }

  if (payload.status === "pending") {
    update.approved_at = null;
    update.approved_by = null;
    update.rejected_at = null;
    update.rejected_by = null;
    update.hidden_at = null;
    update.hidden_by = null;
  }

  const { data, error } = await supabase
    .from("customer_reviews")
    .update(update)
    .eq("tenant_id", tenantId)
    .eq("id", reviewId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Review could not be found for this tenant.");
  }
}

export const ReviewService = {
  createPendingReview,
  listApprovedReviews,
  listAdminReviews,
  moderateReview,
};
