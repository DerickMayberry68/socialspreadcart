"use server";

import { redirect } from "next/navigation";

import { setActiveTenantId } from "@/lib/tenant";
import { getSupabaseUser } from "@/lib/supabase/server";
import { InvitationService } from "@/services/invitation-service";

export async function acceptInvitationAction(formData: FormData) {
  const user = await getSupabaseUser();

  if (!user?.email) {
    const token = String(formData.get("token") ?? "");
    redirect(`/admin/login?returnUrl=${encodeURIComponent(`/accept-invite?token=${token}`)}`);
  }

  const token = String(formData.get("token") ?? "");
  const result = await InvitationService.acceptInvite({
    token,
    userId: user.id,
    email: user.email,
  });

  await setActiveTenantId(result.tenantId);
  redirect("/admin");
}
