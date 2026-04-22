/**
 * Tenant test harness (Spec 002).
 *
 * Builds a pair of fully-provisioned tenants with one auth user each and
 * one row per business-domain table. Used by tests/tenant-isolation.test.ts
 * to prove cross-tenant isolation.
 *
 * Requirements:
 *   - A local Supabase instance must be running (`supabase start`) OR the
 *     URL / keys in .env.test must point at a disposable remote project.
 *   - Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY,
 *     SUPABASE_SERVICE_ROLE_KEY.
 *
 * The harness uses the service-role client ONLY for setup and teardown.
 * All isolation assertions in the actual test suite use anon-key clients
 * authenticated as the per-tenant users — otherwise RLS is bypassed and
 * the tests would prove nothing.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TenantTestFixture = {
  tenantAId: string;
  tenantBId: string;
  userA: { id: string; email: string; password: string };
  userB: { id: string; email: string; password: string };
  seededRowIds: {
    a: SeededRowIds;
    b: SeededRowIds;
  };
  serviceClient: SupabaseClient;
  cleanup: () => Promise<void>;
};

export type SeededRowIds = {
  menuItemId: string;
  eventId: string;
  testimonialId: string;
  quoteId: string;
  contactId: string;
  interactionId: string;
};

const PASSWORD = "tenant-isolation-test-Pw1!";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.test.example to .env.test and fill in the local Supabase values from 'supabase start'.`,
    );
  }
  return value;
}

function slugify(prefix: string, stamp: number): string {
  return `${prefix}-${stamp}`;
}

export function createServiceClient(): SupabaseClient {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createAnonClient(): SupabaseClient {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_ANON_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns an anon-key client signed in as the given user.
 * This is the client the test suite uses for isolation assertions.
 */
export async function authenticatedClientFor(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }
  return client;
}

export async function setupTwoTenants(): Promise<TenantTestFixture> {
  const service = createServiceClient();
  const stamp = Date.now();

  // 1. Create tenants
  const { data: tenants, error: tErr } = await service
    .from("tenants")
    .insert([
      { slug: slugify("tenant-a", stamp), name: "Tenant A", status: "active" },
      { slug: slugify("tenant-b", stamp), name: "Tenant B", status: "active" },
    ])
    .select("id, slug");
  if (tErr || !tenants || tenants.length !== 2) {
    throw new Error(`Failed to create tenants: ${tErr?.message ?? "unknown"}`);
  }
  const tenantAId = tenants[0].id as string;
  const tenantBId = tenants[1].id as string;

  // 2. Create auth users
  const emailA = `a+${stamp}@test.local`;
  const emailB = `b+${stamp}@test.local`;

  const { data: uA, error: uAErr } = await service.auth.admin.createUser({
    email: emailA,
    password: PASSWORD,
    email_confirm: true,
  });
  if (uAErr || !uA.user) {
    throw new Error(`Failed to create user A: ${uAErr?.message ?? "unknown"}`);
  }

  const { data: uB, error: uBErr } = await service.auth.admin.createUser({
    email: emailB,
    password: PASSWORD,
    email_confirm: true,
  });
  if (uBErr || !uB.user) {
    throw new Error(`Failed to create user B: ${uBErr?.message ?? "unknown"}`);
  }

  // 3. Link each user as owner of their own tenant
  const { error: membershipErr } = await service
    .from("tenant_users")
    .insert([
      { tenant_id: tenantAId, user_id: uA.user.id, role: "owner" },
      { tenant_id: tenantBId, user_id: uB.user.id, role: "owner" },
    ]);
  if (membershipErr) {
    throw new Error(
      `Failed to create tenant_users memberships: ${membershipErr.message}`,
    );
  }

  // 4. Seed one row per business table per tenant
  const seededA = await seedBusinessRows(service, tenantAId, "A", stamp);
  const seededB = await seedBusinessRows(service, tenantBId, "B", stamp);

  const cleanup = async () => {
    // Delete in reverse-dependency order. FK `on delete cascade` from tenants
    // would handle most of this, but we do it explicitly to keep teardown
    // observable and to avoid leaving orphan auth users.
    await service.from("interactions").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("quotes").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("contacts").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("testimonials").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("events").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("menu_items").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("tenant_users").delete().in("tenant_id", [tenantAId, tenantBId]);
    await service.from("tenants").delete().in("id", [tenantAId, tenantBId]);
    await service.auth.admin.deleteUser(uA.user.id);
    await service.auth.admin.deleteUser(uB.user.id);
  };

  return {
    tenantAId,
    tenantBId,
    userA: { id: uA.user.id, email: emailA, password: PASSWORD },
    userB: { id: uB.user.id, email: emailB, password: PASSWORD },
    seededRowIds: { a: seededA, b: seededB },
    serviceClient: service,
    cleanup,
  };
}

async function seedBusinessRows(
  service: SupabaseClient,
  tenantId: string,
  suffix: string,
  stamp: number,
): Promise<SeededRowIds> {
  // menu_items (bigint PK, no default — must provide numeric ID)
  const menuItemId = stamp + (suffix === "A" ? 1 : 2);
  {
    const { error } = await service.from("menu_items").insert({
      id: menuItemId,
      tenant_id: tenantId,
      name: `Menu Item ${suffix}`,
      slug: slugify(`menu-item-${suffix.toLowerCase()}`, stamp),
      description: "Test item",
      price: 10.0,
      category: "Charcuterie",
      dietary: [],
      image_url: "/test.jpg",
      is_active: true,
    });
    if (error) throw new Error(`Seed menu_items failed: ${error.message}`);
  }

  // events (bigint PK, no default — must provide numeric ID)
  const eventId = stamp + (suffix === "A" ? 3 : 4);
  {
    const { error } = await service.from("events").insert({
      id: eventId,
      tenant_id: tenantId,
      title: `Event ${suffix}`,
      event_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      start_time: "10:00",
      location: "Test Location",
      description: "Test event",
      image_url: "/test.jpg",
    });
    if (error) throw new Error(`Seed events failed: ${error.message}`);
  }

  // testimonials (text PK)
  const testimonialId = `testimonial-${suffix}-${stamp}`;
  {
    const { error } = await service.from("testimonials").insert({
      id: testimonialId,
      tenant_id: tenantId,
      name: `Reviewer ${suffix}`,
      occasion: "Test",
      quote: "Excellent.",
    });
    if (error) throw new Error(`Seed testimonials failed: ${error.message}`);
  }

  // contacts
  const { data: contact, error: contactErr } = await service
    .from("contacts")
    .insert({
      tenant_id: tenantId,
      name: `Contact ${suffix}`,
      email: `contact+${suffix}-${stamp}@test.local`,
      phone: "4795550000",
      source: "quote",
      status: "new",
    })
    .select("id")
    .single();
  if (contactErr || !contact) {
    throw new Error(`Seed contacts failed: ${contactErr?.message ?? "unknown"}`);
  }
  const contactId = contact.id as string;

  // quotes (bigint PK, no default — must provide numeric ID)
  const quoteIdNum = stamp + (suffix === "A" ? 5 : 6);
  const { data: quote, error: quoteErr } = await service
    .from("quotes")
    .insert({
      id: quoteIdNum,
      tenant_id: tenantId,
      contact_id: contactId,
      name: `Customer ${suffix}`,
      email: `customer+${suffix}-${stamp}@test.local`,
      phone: "4795551111",
      event_date: new Date(Date.now() + 14 * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      event_type: "Wedding",
      guests: "50",
      services: ["Charcuterie Cart"],
      message: "",
      status: "new",
    })
    .select("id")
    .single();
  if (quoteErr || !quote) {
    throw new Error(`Seed quotes failed: ${quoteErr?.message ?? "unknown"}`);
  }
  const quoteId = quote.id as string;

  // interactions
  const { data: interaction, error: iErr } = await service
    .from("interactions")
    .insert({
      tenant_id: tenantId,
      contact_id: contactId,
      type: "quote_submitted",
      body: `Quote ${suffix} submitted`,
    })
    .select("id")
    .single();
  if (iErr || !interaction) {
    throw new Error(`Seed interactions failed: ${iErr?.message ?? "unknown"}`);
  }
  const interactionId = interaction.id as string;

  return {
    menuItemId: String(menuItemId),
    eventId: String(eventId),
    quoteId,
    testimonialId,
    contactId,
    interactionId,
  };
}
