/**
 * requireTenantAdmin() — admin route-handler guard.
 *
 * Resolves the current Supabase user and the tenant inferred from
 * the x-tenant-id header (middleware-injected), then verifies that
 * the user has an owner/admin membership in that tenant via
 * public.tenant_users.
 *
 * On success returns { user, tenant } (both non-null).
 * On failure returns a NextResponse with the right HTTP status
 * code; callers do `if ('error' in guard) return guard.error`.
 */

import { NextResponse } from "next/server";

import { getSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import type { User } from "@supabase/supabase-js";

type Tenant = Awaited<ReturnType<typeof getCurrentTenant>>;

export type TenantAdminGuardSuccess = {
  user: User;
  tenant: Tenant;
};

export type TenantAdminGuardFailure = {
  error: NextResponse;
};

export type TenantAdminGuardResult =
  | TenantAdminGuardSuccess
  | TenantAdminGuardFailure;

export async function requireTenantAdmin(): Promise<TenantAdminGuardResult> {
  const user = await getSupabaseUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Not authenticated" },
        { status: 401 },
      ),
    };
  }

  let tenant: Tenant;
  try {
    tenant = await getCurrentTenant();
  } catch {
    return {
      error: NextResponse.json(
        { ok: false, message: "Tenant could not be resolved" },
        { status: 400 },
      ),
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Supabase unavailable" },
        { status: 500 },
      ),
    };
  }

  const { data, error } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Membership lookup failed" },
        { status: 500 },
      ),
    };
  }

  const role = (data as { role?: string } | null)?.role;
  if (role !== "owner" && role !== "admin") {
    return {
      error: NextResponse.json(
        { ok: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { user, tenant };
}
