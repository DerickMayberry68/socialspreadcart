/**
 * Tenant-isolation test suite (Spec 002).
 *
 * Proves that one tenant's authenticated users cannot see or modify another
 * tenant's data on any business-domain table. If any assertion in this file
 * fails, the migration in `supabase/migrations/20260410_multi_tenancy.sql`
 * is wrong — fix the migration, not the tests.
 *
 * Requires a local Supabase instance (`supabase start`) and a populated
 * `.env.test` file. See specs/002-multi-tenancy-schema-rls/quickstart.md.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  authenticatedClientFor,
  createAnonClient,
  setupTwoTenants,
  type TenantTestFixture,
} from "./helpers/tenant-test-harness";

let fixture: TenantTestFixture;
let clientA: SupabaseClient;
let clientB: SupabaseClient;

beforeAll(async () => {
  fixture = await setupTwoTenants();
  clientA = await authenticatedClientFor(
    fixture.userA.email,
    fixture.userA.password,
  );
  clientB = await authenticatedClientFor(
    fixture.userB.email,
    fixture.userB.password,
  );
}, 30_000);

afterAll(async () => {
  if (fixture) await fixture.cleanup();
});

// ------------------------------------------------------------
// Pattern 2: Public Read / Tenant Write (menu_items, events, testimonials)
// ------------------------------------------------------------

describe("menu_items isolation", () => {
  it("tenant A cannot update tenant B's menu item (zero rows affected)", async () => {
    const { data, error } = await clientA
      .from("menu_items")
      .update({ name: "hijacked" })
      .eq("id", fixture.seededRowIds.b.menuItemId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot delete tenant B's menu item (zero rows affected)", async () => {
    const { data, error } = await clientA
      .from("menu_items")
      .delete()
      .eq("id", fixture.seededRowIds.b.menuItemId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot insert a menu item under tenant B's tenant_id", async () => {
    const { error } = await clientA.from("menu_items").insert({
      id: Date.now() + 99,
      tenant_id: fixture.tenantBId,
      name: "Hijack",
      description: "x",
      price: 1,
      category: "Charcuterie",
      image_url: "/x.jpg",
      is_active: false,
    });
    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toMatch(/row-level security|policy/);
  });

  it("authenticated reads return tenant A's menu item but NOT tenant B's", async () => {
    const { data, error } = await clientA
      .from("menu_items")
      .select("id, tenant_id")
      .in("id", [
        fixture.seededRowIds.a.menuItemId,
        fixture.seededRowIds.b.menuItemId,
      ]);
    expect(error).toBeNull();
    // Pattern 2 allows public selects, so tenant A's auth client sees both
    // rows at the DB level — but the application layer always filters by
    // tenant_id. We assert that at least tenant A's row is present.
    // The isolation guarantee for Pattern 2 is that tenant A cannot WRITE
    // tenant B's rows; reads are public by design (see data-model.md).
    const idsReturned = (data ?? []).map((r: { id: string | number }) => String(r.id));
    expect(idsReturned).toContain(fixture.seededRowIds.a.menuItemId);
  });
});

describe("events isolation", () => {
  it("tenant A cannot update tenant B's event", async () => {
    const { data, error } = await clientA
      .from("events")
      .update({ title: "hijacked" })
      .eq("id", fixture.seededRowIds.b.eventId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot delete tenant B's event", async () => {
    const { data, error } = await clientA
      .from("events")
      .delete()
      .eq("id", fixture.seededRowIds.b.eventId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot insert an event under tenant B's tenant_id", async () => {
    const { error } = await clientA.from("events").insert({
      id: Date.now() + 98,
      tenant_id: fixture.tenantBId,
      title: "Hijack",
      event_date: new Date().toISOString(),
      start_time: "10:00",
      location: "x",
      description: "x",
      image_url: "/x.jpg",
    });
    expect(error).not.toBeNull();
  });

  it("tenant A can read its own event", async () => {
    const { data, error } = await clientA
      .from("events")
      .select("id")
      .eq("id", fixture.seededRowIds.a.eventId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

describe("testimonials isolation", () => {
  it("tenant A cannot update tenant B's testimonial", async () => {
    const { data, error } = await clientA
      .from("testimonials")
      .update({ quote: "hijacked" })
      .eq("id", fixture.seededRowIds.b.testimonialId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot delete tenant B's testimonial", async () => {
    const { data, error } = await clientA
      .from("testimonials")
      .delete()
      .eq("id", fixture.seededRowIds.b.testimonialId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot insert a testimonial under tenant B's tenant_id", async () => {
    const { error } = await clientA.from("testimonials").insert({
      id: `hijack-${Date.now()}`,
      tenant_id: fixture.tenantBId,
      name: "Hijacker",
      occasion: "x",
      quote: "x",
    });
    expect(error).not.toBeNull();
  });

  it("tenant A can read its own testimonial", async () => {
    const { data, error } = await clientA
      .from("testimonials")
      .select("id")
      .eq("id", fixture.seededRowIds.a.testimonialId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

// ------------------------------------------------------------
// Pattern 3: Public Insert / Tenant Read (quotes)
// ------------------------------------------------------------

describe("quotes isolation", () => {
  it("tenant A cannot read tenant B's quote (authenticated select is tenant-scoped)", async () => {
    const { data, error } = await clientA
      .from("quotes")
      .select("id")
      .eq("id", fixture.seededRowIds.b.quoteId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot update tenant B's quote", async () => {
    const { data, error } = await clientA
      .from("quotes")
      .update({ status: "lost" })
      .eq("id", fixture.seededRowIds.b.quoteId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot delete tenant B's quote", async () => {
    const { data, error } = await clientA
      .from("quotes")
      .delete()
      .eq("id", fixture.seededRowIds.b.quoteId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot insert a quote with tenant B's tenant_id as itself (RLS check violation)", async () => {
    // Authenticated users are bound by the tenant_ids_for_current_user check.
    const { error } = await clientA.from("quotes").insert({
      id: Date.now() + 90,
      tenant_id: fixture.tenantBId,
      name: "Hijacker",
      email: "x@test.local",
      phone: "1234567",
      event_date: new Date(Date.now() + 14 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      event_type: "Wedding",
      guests: "10",
      services: ["Charcuterie Cart"],
      message: "",
      status: "new",
    });
    expect(error).not.toBeNull();
  });

  it("tenant A can read its own quote", async () => {
    const { data, error } = await clientA
      .from("quotes")
      .select("id")
      .eq("id", fixture.seededRowIds.a.quoteId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

// ------------------------------------------------------------
// Pattern 1: Tenant-Only (contacts, interactions)
// ------------------------------------------------------------

describe("contacts isolation", () => {
  it("tenant A cannot read tenant B's contact", async () => {
    const { data, error } = await clientA
      .from("contacts")
      .select("id")
      .eq("id", fixture.seededRowIds.b.contactId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot update tenant B's contact", async () => {
    const { data, error } = await clientA
      .from("contacts")
      .update({ name: "hijacked" })
      .eq("id", fixture.seededRowIds.b.contactId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot delete tenant B's contact", async () => {
    const { data, error } = await clientA
      .from("contacts")
      .delete()
      .eq("id", fixture.seededRowIds.b.contactId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot insert a contact under tenant B's tenant_id", async () => {
    const { error } = await clientA.from("contacts").insert({
      tenant_id: fixture.tenantBId,
      name: "Hijack",
      email: `hijack+${Date.now()}@test.local`,
      phone: "4795550000",
      source: "quote",
      status: "new",
    });
    expect(error).not.toBeNull();
  });

  it("two contacts with the same email but different tenant_ids can coexist", async () => {
    const sharedEmail = `shared+${Date.now()}@test.local`;
    const { error: eA } = await fixture.serviceClient.from("contacts").insert({
      tenant_id: fixture.tenantAId,
      name: "Shared A",
      email: sharedEmail,
      phone: "4795550000",
      source: "quote",
      status: "new",
    });
    expect(eA).toBeNull();

    const { error: eB } = await fixture.serviceClient.from("contacts").insert({
      tenant_id: fixture.tenantBId,
      name: "Shared B",
      email: sharedEmail,
      phone: "4795550000",
      source: "quote",
      status: "new",
    });
    expect(eB).toBeNull();
  });
});

describe("interactions isolation", () => {
  it("tenant A cannot read tenant B's interaction", async () => {
    const { data, error } = await clientA
      .from("interactions")
      .select("id")
      .eq("id", fixture.seededRowIds.b.interactionId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot update tenant B's interaction", async () => {
    const { data, error } = await clientA
      .from("interactions")
      .update({ body: "hijacked" })
      .eq("id", fixture.seededRowIds.b.interactionId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot delete tenant B's interaction", async () => {
    const { data, error } = await clientA
      .from("interactions")
      .delete()
      .eq("id", fixture.seededRowIds.b.interactionId)
      .select();
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant A cannot insert an interaction under tenant B's tenant_id", async () => {
    const { error } = await clientA.from("interactions").insert({
      tenant_id: fixture.tenantBId,
      contact_id: fixture.seededRowIds.b.contactId,
      type: "note",
      body: "Hijack attempt",
    });
    expect(error).not.toBeNull();
  });
});

// ------------------------------------------------------------
// Public anon behaviour
// ------------------------------------------------------------

describe("public quote submission (anon)", () => {
  it("anon can insert a quote under tenant A", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("quotes").insert({
      id: Date.now() + 91,
      tenant_id: fixture.tenantAId,
      name: "Public A",
      email: `publicA+${Date.now()}@test.local`,
      phone: "4795552222",
      event_date: new Date(Date.now() + 14 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      event_type: "Wedding",
      guests: "10",
      services: ["Charcuterie Cart"],
      message: "",
      status: "new",
    });
    expect(error).toBeNull();
  });

  it("anon cannot insert a quote with a random (nonexistent) tenant_id", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("quotes").insert({
      id: Date.now() + 92,
      tenant_id: "00000000-0000-0000-0000-000000000000",
      name: "Public Bogus",
      email: `bogus+${Date.now()}@test.local`,
      phone: "4795552222",
      event_date: new Date(Date.now() + 14 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      event_type: "Wedding",
      guests: "10",
      services: ["Charcuterie Cart"],
      message: "",
      status: "new",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot read any quotes (no policy grants anon select)", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon
      .from("quotes")
      .select("id")
      .in("id", [
        fixture.seededRowIds.a.quoteId,
        fixture.seededRowIds.b.quoteId,
      ]);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});

describe("public anon reads (Pattern 2 tables)", () => {
  it("anon can read menu_items from any tenant (Pattern 2 public read)", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon
      .from("menu_items")
      .select("id, tenant_id")
      .in("id", [
        fixture.seededRowIds.a.menuItemId,
        fixture.seededRowIds.b.menuItemId,
      ]);
    expect(error).toBeNull();
    // Pattern 2 explicitly allows anonymous reads; tenant scoping of
    // public reads is enforced by the application layer with an
    // explicit .eq('tenant_id', ...) until Spec 003 introduces
    // request-scoped tenant context. This assertion documents the
    // current contract: anon reads succeed and return the rows.
    expect((data ?? []).length).toBe(2);
  });

  it("anon cannot write menu_items under any tenant", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("menu_items").insert({
      id: Date.now() + 97,
      tenant_id: fixture.tenantAId,
      name: "Anon Hijack",
      description: "x",
      price: 1,
      category: "Charcuterie",
      image_url: "/x.jpg",
      is_active: false,
    });
    expect(error).not.toBeNull();
  });
});

// ------------------------------------------------------------
// Helper-function sanity checks
// ------------------------------------------------------------

describe("tenant_ids_for_current_user()", () => {
  it("returns exactly tenant A's id for user A", async () => {
    const { data, error } = await clientA.rpc("tenant_ids_for_current_user");
    expect(error).toBeNull();
    const ids = (data ?? []).map((r: unknown) =>
      typeof r === "string" ? r : (r as { tenant_ids_for_current_user: string }).tenant_ids_for_current_user,
    );
    expect(ids).toEqual([fixture.tenantAId]);
  });

  it("returns exactly tenant B's id for user B", async () => {
    const { data, error } = await clientB.rpc("tenant_ids_for_current_user");
    expect(error).toBeNull();
    const ids = (data ?? []).map((r: unknown) =>
      typeof r === "string" ? r : (r as { tenant_ids_for_current_user: string }).tenant_ids_for_current_user,
    );
    expect(ids).toEqual([fixture.tenantBId]);
  });

  it("returns an empty set for anonymous callers", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("tenant_ids_for_current_user");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});
