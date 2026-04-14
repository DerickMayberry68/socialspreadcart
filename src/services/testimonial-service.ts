import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/lib/types";

async function listTestimonials(tenantId: string): Promise<Testimonial[]> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error || !data) {
    return [];
  }

  return data as Testimonial[];
}

export const TestimonialService = {
  listTestimonials,
};
