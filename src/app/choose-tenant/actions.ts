"use server";

import { redirect } from "next/navigation";

import { setActiveTenantId } from "@/lib/tenant";
import { getSupabaseUser } from "@/lib/supabase/server";
import { TenantService } from "@/services/tenant-service";

export async function selectTenantAction(formData: FormData) {
  const user = await getSupabaseUser();

  if (!user) {
    redirect("/admin/login");
  }

  const tenantId = String(formData.get("tenantId") ?? "");
  const returnUrl = String(formData.get("returnUrl") ?? "/admin");
  const membership = await TenantService.getMembershipForUser(tenantId, user.id);

  if (!membership || membership.tenant?.status !== "active") {
    throw new Error("You do not have access to that tenant.");
  }

  await setActiveTenantId(tenantId);
  redirect(returnUrl || "/admin");
}
