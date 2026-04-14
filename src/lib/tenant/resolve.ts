/**
 * Tenant resolution from HTTP host header.
 *
 * resolveTenantFromHost() is called from middleware on every non-static
 * request. It is intentionally pure except for the single DB call so it
 * can be unit-tested with a mock Supabase client.
 *
 * Resolution precedence:
 *   1. Dev-mode ?_tenant=<slug> query parameter (NODE_ENV=development only)
 *   2. Subdomain of a recognized app host
 *   3. Bare domain / www -> legacy tenant slug when
 *      ENABLE_BARE_DOMAIN_LEGACY !== "false"
 *   4. Bare domain / www -> TenantResolutionError("unknown_slug") when flag off
 */

import { TenantResolutionError } from "./errors";
import { TenantService, type TenantQueryClient } from "@/services/tenant-service";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: "active" | "suspended" | "archived";
  created_at: string;
  updated_at: string;
};

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

function normalizeHostname(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate).hostname.toLowerCase();
  } catch {
    return trimmed.split("/")[0]?.split(":")[0] ?? null;
  }
}

function getTenantRoutingHostnames(): string[] {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_DOMAIN,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "socialspreadcart.com",
  ];

  return Array.from(
    new Set(
      candidates
        .map((candidate) => normalizeHostname(candidate))
        .filter((hostname): hostname is string => Boolean(hostname)),
    ),
  );
}

/**
 * Parse the leading subdomain label from an HTTP host value.
 *
 * Examples:
 *   "sarah.socialspreadcart.com" -> "sarah"
 *   "sarah.localhost:3000" -> "sarah"
 *   "socialspreadcart.com" -> null
 *   "localhost:3000" -> null
 *   "www.socialspreadcart.com" -> null
 *   "foo.bar.socialspreadcart.com" -> null
 *   "socialspreadcart.vercel.app" -> null
 */
export function parseSubdomain(
  host: string,
  baseHostnames: string[] = getTenantRoutingHostnames(),
): string | null {
  const hostname = normalizeHostname(host);

  if (!hostname) {
    return null;
  }

  const localhostMatch = hostname.match(/^([^.]+)\.localhost$/);
  if (localhostMatch) {
    return localhostMatch[1] === "www" ? null : localhostMatch[1];
  }

  if (hostname === "localhost") {
    return null;
  }

  for (const baseHostname of baseHostnames) {
    if (hostname === baseHostname || hostname === `www.${baseHostname}`) {
      return null;
    }

    if (!hostname.endsWith(`.${baseHostname}`)) {
      continue;
    }

    const subdomain = hostname.slice(0, -(baseHostname.length + 1));

    if (!subdomain || subdomain.includes(".") || subdomain === "www") {
      return null;
    }

    return subdomain;
  }

  if (hostname.endsWith(".vercel.app")) {
    return null;
  }

  return null;
}

/**
 * Resolve the active Tenant for a given HTTP host and optional URL search params.
 *
 * Returns a Tenant on success, or a TenantResolutionError on failure.
 * Never throws - callers inspect the return type.
 */
export async function resolveTenantFromHost(
  host: string,
  supabase: TenantQueryClient,
  searchParams?: URLSearchParams,
): Promise<Tenant | TenantResolutionError> {
  let slug: string | null = null;

  if (process.env.NODE_ENV === "development" && searchParams?.has("_tenant")) {
    slug = searchParams.get("_tenant")!.toLowerCase();
  } else {
    slug = parseSubdomain(host);
  }

  if (slug === null) {
    const legacyEnabled = process.env.ENABLE_BARE_DOMAIN_LEGACY !== "false";

    if (!legacyEnabled) {
      return new TenantResolutionError(
        "unknown_slug",
        "Bare domain access is disabled; redirect to tenant subdomain.",
      );
    }

    slug = getLegacyTenantSlug();
  }

  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return new TenantResolutionError(
      "reserved",
      `The slug "${slug}" is reserved and cannot be used as a tenant identifier.`,
    );
  }

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
