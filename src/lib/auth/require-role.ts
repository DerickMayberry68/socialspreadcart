import { forbidden } from "next/navigation";

import { getSupabaseUser } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import type { TenantRole } from "@/lib/types";
import { TenantService } from "@/services/tenant-service";

const ROLE_RANK: Record<TenantRole, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
};

export async function requireRole(minRole: TenantRole): Promise<{
  tenantId: string;
  userId: string;
  role: TenantRole;
}> {
  const [user, tenant] = await Promise.all([
    getSupabaseUser(),
    getCurrentTenant(),
  ]);

  if (!user) {
    forbidden();
  }

  const membership = await TenantService.getMembershipForUser(
    tenant.id,
    user.id,
  );

  if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    forbidden();
  }

  return {
    tenantId: tenant.id,
    userId: user.id,
    role: membership.role,
  };
}
