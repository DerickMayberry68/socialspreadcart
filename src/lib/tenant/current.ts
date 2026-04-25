/**
 * getCurrentTenant() — Server Component / Route Handler / Server Action helper.
 *
 * Preferentially reads the x-tenant-id header injected by middleware, fetches
 * the full Tenant record, and returns it. Memoized with React's cache() so the
 * DB is hit at most once per request regardless of how many times it is called.
 *
 * If the header is missing (some dev/RSC paths do not surface middleware
 * request headers via headers()), falls back to the same host-based resolution
 * middleware uses so public pages still resolve on localhost and subdomains.
 */

import { cache } from "react";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TenantService, type TenantQueryClient } from "@/services/tenant-service";
import { TenantResolutionError } from "./errors";
import type { Tenant } from "./resolve";
import { resolveTenantFromHost } from "./resolve";

export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const headerStore = await headers();
  const tenantId = headerStore.get("x-tenant-id");

  if (tenantId) {
    const tenant = await TenantService.getTenantById(tenantId);

    if (!tenant) {
      throw new TenantResolutionError(
        "unknown_slug",
        `Tenant with id "${tenantId}" not found.`,
      );
    }

    return tenant as Tenant;
  }

  const host =
    headerStore.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headerStore.get("host") ??
    "";

  if (!host) {
    throw new TenantResolutionError(
      "missing_header",
      "x-tenant-id header is absent and Host could not be read. This request may have bypassed middleware.",
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new TenantResolutionError(
      "missing_header",
      "Cannot resolve tenant: Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Middleware could not attach x-tenant-id.",
    );
  }

  const tenantResult = await resolveTenantFromHost(
    host,
    supabase as unknown as TenantQueryClient,
  );

  if (tenantResult instanceof TenantResolutionError) {
    throw tenantResult;
  }

  return tenantResult;
});
