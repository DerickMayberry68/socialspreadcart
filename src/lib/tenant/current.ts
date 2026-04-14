/**
 * getCurrentTenant() — Server Component / Route Handler / Server Action helper.
 *
 * Reads the x-tenant-id header injected by middleware, fetches the full
 * Tenant record, and returns it. Memoized with React's cache() so the DB is
 * hit at most once per request regardless of how many times it is called.
 *
 * Throws TenantResolutionError if the header is absent or the tenant cannot
 * be found. This should only happen if a request bypasses middleware (e.g.
 * direct static asset fetches) — normal page requests always have the header.
 */

import { cache } from "react";
import { headers } from "next/headers";
import { TenantResolutionError } from "./errors";
import type { Tenant } from "./resolve";
import { TenantService } from "@/services/tenant-service";

export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const headerStore = await headers();
  const tenantId = headerStore.get("x-tenant-id");

  if (!tenantId) {
    throw new TenantResolutionError(
      "missing_header",
      "x-tenant-id header is absent. This request may have bypassed middleware.",
    );
  }

  const tenant = await TenantService.getTenantById(tenantId);

  if (!tenant) {
    throw new TenantResolutionError(
      "unknown_slug",
      `Tenant with id "${tenantId}" not found.`,
    );
  }

  return tenant as Tenant;
});
