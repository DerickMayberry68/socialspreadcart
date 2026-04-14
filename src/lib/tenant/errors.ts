/**
 * Typed error class for all tenant-resolution failures.
 * Used by resolveTenantFromHost() and getCurrentTenant().
 */

export type TenantResolutionCode =
  | "missing_header"   // x-tenant-id header absent from request
  | "unknown_slug"     // no tenant row found for the slug
  | "suspended"        // tenant exists but status = 'suspended'
  | "archived"         // tenant exists but status = 'archived'
  | "reserved";        // slug is on the reserved list; never resolvable

export class TenantResolutionError extends Error {
  constructor(
    public readonly code: TenantResolutionCode,
    message: string,
  ) {
    super(message);
    this.name = "TenantResolutionError";
  }
}
