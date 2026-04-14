import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const teamMemberSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "staff"]).optional(),
});

async function updateMemberRole(
  input: z.input<typeof teamMemberSchema> & { role: "owner" | "admin" | "staff" },
): Promise<void> {
  const parsed = teamMemberSchema.extend({
    role: z.enum(["owner", "admin", "staff"]),
  }).parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data: owners, error: ownersError } = await supabase
    .from("tenant_users")
    .select("user_id, role")
    .eq("tenant_id", parsed.tenantId)
    .eq("role", "owner");

  if (ownersError) {
    throw new Error(ownersError.message);
  }

  const ownerCount = (owners ?? []).length;
  const isTargetOwner = (owners ?? []).some((owner) => owner.user_id === parsed.userId);

  if (isTargetOwner && parsed.role !== "owner" && ownerCount <= 1) {
    throw new Error("You cannot remove the last owner from a tenant.");
  }

  const { error } = await supabase
    .from("tenant_users")
    .update({ role: parsed.role })
    .eq("tenant_id", parsed.tenantId)
    .eq("user_id", parsed.userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function removeMember(
  input: z.input<typeof teamMemberSchema>,
): Promise<void> {
  const parsed = teamMemberSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data: owners, error: ownersError } = await supabase
    .from("tenant_users")
    .select("user_id, role")
    .eq("tenant_id", parsed.tenantId)
    .eq("role", "owner");

  if (ownersError) {
    throw new Error(ownersError.message);
  }

  const ownerCount = (owners ?? []).length;
  const isTargetOwner = (owners ?? []).some((owner) => owner.user_id === parsed.userId);

  if (isTargetOwner && ownerCount <= 1) {
    throw new Error("You cannot remove the last owner from a tenant.");
  }

  const { error } = await supabase
    .from("tenant_users")
    .delete()
    .eq("tenant_id", parsed.tenantId)
    .eq("user_id", parsed.userId);

  if (error) {
    throw new Error(error.message);
  }
}

export const TeamService = {
  updateMemberRole,
  removeMember,
};
