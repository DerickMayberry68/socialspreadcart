import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Interaction } from "@/lib/types";

const createInteractionSchema = z.object({
  tenantId: z.string().uuid(),
  contactId: z.string().uuid(),
  type: z.enum(["note", "follow_up", "quote_submitted", "status_change", "contact_form"]),
  body: z.string().min(1),
});

async function createInteraction(
  input: z.input<typeof createInteractionSchema>,
): Promise<Interaction> {
  const parsed = createInteractionSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      tenant_id: parsed.tenantId,
      contact_id: parsed.contactId,
      type: parsed.type,
      body: parsed.body,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save interaction.");
  }

  return data as Interaction;
}

export const InteractionService = {
  createInteraction,
};
