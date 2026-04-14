/**
 * Tenant resolution from HTTP host header.
 *
 * resolveTenantFromHost() is called from middleware on every non-static
 * request. It is intentionally pure except for the single DB call so it
 * can be unit-tested with a mock Supabase client.
 *
 * Resolution precedence:
 *   1. Dev-mode ?_tenant=<slug> query parameter (NODE_ENV=development only)
 *   2. Subdomain of the host (sarah.socialspreadcart.com → 'sarah')
 *   3. Bare domain / www → legacy tenant slug ('sarah') when
 *      ENABLE_BARE_DOMAIN_LEGACY !== 'false'
 *   4. Bare domain / www → TenantResolutionError('unknown_slug') when flag off
 */

import { TenantResolutionError } from "./errors";
import { TenantService, type TenantQueryClient } from "@/services/tenant-service";

// ── Types ────────────────────────────────────────────────────────────────────

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: "active" | "suspended" | "archived";
  created_at: string;
  updated_at: string;
};

// ── Constants ────────────────────────────────────────────────────────────────

export const RESERVED_SLUGS = [
  "app",
  "api",
  "www",
  "admin",
  "auth",
  "status",
  "docs",
  "staging",
  "cdn",
  "mail",
] as const;

export function getLegacyTenantSlug(): string {
  return (process.env.LEGACY_TENANT_SLUG ?? "sarah").trim().toLowerCase();
}

// ── Host Parsing ─────────────────────────────────────────────────────────────

/**
 * Parse the leading subdomain label from an HTTP host value.
 *
 * Examples:
 *   'sarah.socialspreadcart.com'  → 'sarah'
 *   'sarah.localhost:3000'        → 'sarah'
 *   'socialspreadcart.com'        → null  (bare domain)
 *   'localhost:3000'              → null  (bare domain)
 *   'www.socialspreadcart.com'    → null  (www treated as bare)
 *   'foo.bar.socialspreadcart.com'→ null  (multi-label — rejected)
 *   'SARAH.localhost:3000'        → 'sarah' (lowercased)
 */
export function parseSubdomain(host: string): string | null {
  // Strip port
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");

  // Special case: <subdomain>.localhost (exactly 2 parts, second is 'localhost')
  // Must be checked BEFORE the general <= 2 guard below.
  if (parts.length === 2 && parts[1] === "localhost") {
    const subdomain = parts[0];
    if (subdomain === "www") return null;
    return subdomain;
  }

  // Bare domain: single label ('localhost') or two-part ('socialspreadcart.com')
  if (parts.length <= 2) return null;

  // Multi-label: 'foo.bar.socialspreadcart.com' (4+ parts) — reject
  if (parts.length > 3) return null;

  // Standard: '<subdomain>.<domain>.<tld>' (exactly 3 parts)
  const subdomain = parts[0];

  // Treat 'www' as bare domain
  if (subdomain === "www") return null;

  return subdomain;
}

// ── Tenant Resolution ────────────────────────────────────────────────────────

/**
 * Resolve the active Tenant for a given HTTP host and optional URL search params.
 *
 * Returns a Tenant on success, or a TenantResolutionError on failure.
 * Never throws — callers inspect the return type.
 */
export async function resolveTenantFromHost(
  host: string,
  supabase: TenantQueryClient,
  searchParams?: URLSearchParams,
): Promise<Tenant | TenantResolutionError> {
  // Dev-mode ?_tenant= override
  let slug: string | null = null;

  if (
    process.env.NODE_ENV === "development" &&
    searchParams?.has("_tenant")
  ) {
    slug = searchParams.get("_tenant")!.toLowerCase();
  } else {
    slug = parseSubdomain(host);
  }

  // Bare domain / www fallback
  if (slug === null) {
    const legacyEnabled =
      process.env.ENABLE_BARE_DOMAIN_LEGACY !== "false";

    if (!legacyEnabled) {
      return new TenantResolutionError(
        "unknown_slug",
        "Bare domain access is disabled; redirect to tenant subdomain.",
      );
    }

    slug = getLegacyTenantSlug();
  }

  // Reserved slug check — never hit the DB
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return new TenantResolutionError(
      "reserved",
      `The slug "${slug}" is reserved and cannot be used as a tenant identifier.`,
    );
  }

  // DB lookup
  const tenant = await TenantService.getTenantBySlug(slug, supabase);

  if (!tenant) {
    return new TenantResolutionError(
      "unknown_slug",
      `No tenant found for slug "${slug}".`,
    );
  }

  if (tenant.status === "suspended") {
    return new TenantResolutionError(
      "suspended",
      `Tenant "${slug}" is suspended.`,
    );
  }

  if (tenant.status === "archived") {
    return new TenantResolutionError(
      "archived",
      `Tenant "${slug}" is archived.`,
    );
  }

  return tenant;
}
