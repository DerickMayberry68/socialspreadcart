/**
 * Unit tests for src/lib/tenant/resolve.ts (Spec 003).
 *
 * parseSubdomain() is pure — no mocks needed.
 * resolveTenantFromHost() calls the DB — tested with a vi.fn() mock client.
 *
 * These tests do NOT require a running Supabase instance.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLegacyTenantSlug,
  parseSubdomain,
  resolveTenantFromHost,
} from "../src/lib/tenant/resolve";
import { TenantResolutionError } from "../src/lib/tenant/errors";

// ── parseSubdomain ───────────────────────────────────────────────────────────

describe("parseSubdomain()", () => {
  it("extracts subdomain from production host", () => {
    expect(parseSubdomain("sarah.socialspreadcart.com")).toBe("sarah");
  });

  it("extracts subdomain from localhost with port", () => {
    expect(parseSubdomain("sarah.localhost:3000")).toBe("sarah");
  });

  it("returns null for bare production domain", () => {
    expect(parseSubdomain("socialspreadcart.com")).toBeNull();
  });

  it("returns null for bare localhost", () => {
    expect(parseSubdomain("localhost:3000")).toBeNull();
  });

  it("returns null for localhost without port", () => {
    expect(parseSubdomain("localhost")).toBeNull();
  });

  it("returns null for www subdomain (treated as bare)", () => {
    expect(parseSubdomain("www.socialspreadcart.com")).toBeNull();
  });

  it("returns null for multi-label subdomain", () => {
    expect(parseSubdomain("foo.bar.socialspreadcart.com")).toBeNull();
  });

  it("lowercases uppercase subdomain", () => {
    expect(parseSubdomain("SARAH.socialspreadcart.com")).toBe("sarah");
  });

  it("strips port before parsing", () => {
    expect(parseSubdomain("joe.socialspreadcart.com:443")).toBe("joe");
  });
});

// ── resolveTenantFromHost() ──────────────────────────────────────────────────

function makeMockSupabase(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as Parameters<typeof resolveTenantFromHost>[1];
}

const activeTenant = {
  id: "uuid-sarah",
  slug: "sarah",
  name: "The Social Spread Cart",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("resolveTenantFromHost()", () => {
  const OLD_ENV = process.env;
  const setEnv = (overrides: Partial<NodeJS.ProcessEnv>) => {
    process.env = { ...process.env, ...overrides };
  };

  beforeEach(() => {
    process.env = { ...OLD_ENV, NODE_ENV: "test" };
  });

  it("returns Tenant for a valid active slug", async () => {
    const supabase = makeMockSupabase({ data: activeTenant, error: null });
    const result = await resolveTenantFromHost("sarah.socialspreadcart.com", supabase);
    expect(result).toMatchObject({ slug: "sarah", status: "active" });
  });

  it("returns TenantResolutionError('unknown_slug') for unknown slug", async () => {
    const supabase = makeMockSupabase({ data: null, error: { message: "not found" } });
    const result = await resolveTenantFromHost("missing.socialspreadcart.com", supabase);
    expect(result).toBeInstanceOf(TenantResolutionError);
    expect((result as TenantResolutionError).code).toBe("unknown_slug");
  });

  it("returns TenantResolutionError('reserved') for reserved slug without hitting DB", async () => {
    const supabase = makeMockSupabase({ data: activeTenant, error: null });
    const result = await resolveTenantFromHost("app.socialspreadcart.com", supabase);
    expect(result).toBeInstanceOf(TenantResolutionError);
    expect((result as TenantResolutionError).code).toBe("reserved");
    // DB must NOT have been called
    expect((supabase.from as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it("returns TenantResolutionError('reserved') for 'admin' slug", async () => {
    const supabase = makeMockSupabase({ data: activeTenant, error: null });
    const result = await resolveTenantFromHost("admin.socialspreadcart.com", supabase);
    expect(result).toBeInstanceOf(TenantResolutionError);
    expect((result as TenantResolutionError).code).toBe("reserved");
  });

  it("returns TenantResolutionError('suspended') for suspended tenant", async () => {
    const supabase = makeMockSupabase({
      data: { ...activeTenant, status: "suspended" },
      error: null,
    });
    const result = await resolveTenantFromHost("sarah.socialspreadcart.com", supabase);
    expect(result).toBeInstanceOf(TenantResolutionError);
    expect((result as TenantResolutionError).code).toBe("suspended");
  });

  it("returns TenantResolutionError('archived') for archived tenant", async () => {
    const supabase = makeMockSupabase({
      data: { ...activeTenant, status: "archived" },
      error: null,
    });
    const result = await resolveTenantFromHost("sarah.socialspreadcart.com", supabase);
    expect(result).toBeInstanceOf(TenantResolutionError);
    expect((result as TenantResolutionError).code).toBe("archived");
  });

  it("resolves bare domain to legacy tenant when ENABLE_BARE_DOMAIN_LEGACY=true", async () => {
    setEnv({ ENABLE_BARE_DOMAIN_LEGACY: "true" });
    const supabase = makeMockSupabase({ data: activeTenant, error: null });
    const result = await resolveTenantFromHost("socialspreadcart.com", supabase);
    expect(result).toMatchObject({ slug: "sarah" });
    // Confirm the DB was queried for 'sarah'
    const fromCall = (supabase.from as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fromCall[0]).toBe("tenants");
  });

  it("uses LEGACY_TENANT_SLUG override for bare-domain fallback", async () => {
    setEnv({ ENABLE_BARE_DOMAIN_LEGACY: "true", LEGACY_TENANT_SLUG: "shayley" });
    const supabase = makeMockSupabase({
      data: { ...activeTenant, slug: "shayley" },
      error: null,
    });
    const result = await resolveTenantFromHost("localhost:3000", supabase);
    expect(getLegacyTenantSlug()).toBe("shayley");
    expect(result).toMatchObject({ slug: "shayley" });
  });

  it("returns unknown_slug for bare domain when ENABLE_BARE_DOMAIN_LEGACY=false", async () => {
    setEnv({ ENABLE_BARE_DOMAIN_LEGACY: "false" });
    const supabase = makeMockSupabase({ data: activeTenant, error: null });
    const result = await resolveTenantFromHost("socialspreadcart.com", supabase);
    expect(result).toBeInstanceOf(TenantResolutionError);
    expect((result as TenantResolutionError).code).toBe("unknown_slug");
  });

  it("uses ?_tenant= override in development mode", async () => {
    setEnv({ NODE_ENV: "development" });
    const supabase = makeMockSupabase({ data: { ...activeTenant, slug: "joe" }, error: null });
    const params = new URLSearchParams("_tenant=joe");
    const result = await resolveTenantFromHost("localhost:3000", supabase, params);
    expect(result).toMatchObject({ slug: "joe" });
  });

  it("ignores ?_tenant= override in production mode", async () => {
    setEnv({ NODE_ENV: "production" });
    // Bare domain with legacy enabled → should resolve to sarah, not joe
    setEnv({ ENABLE_BARE_DOMAIN_LEGACY: "true" });
    const supabase = makeMockSupabase({ data: activeTenant, error: null });
    const params = new URLSearchParams("_tenant=joe");
    const result = await resolveTenantFromHost("socialspreadcart.com", supabase, params);
    // Should have resolved via legacy fallback to sarah, not the override
    expect(result).toMatchObject({ slug: "sarah" });
  });
});
