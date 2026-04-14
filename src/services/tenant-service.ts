import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/tenant/resolve";
import type { TenantMembership } from "@/lib/types";

type TenantQueryResult =
  | PromiseLike<{ data: unknown; error: unknown }>
  | { data: unknown; error: unknown };

type TenantSelectBuilder = {
  eq: (column: string, value: string) => TenantSelectBuilder;
  order: (column: string, options: { ascending: boolean }) => TenantQueryResult;
  single: () => TenantQueryResult;
};

export type TenantQueryClient = {
  from: (table: string) => {
    select: (columns: string) => TenantSelectBuilder;
  };
};

async function resolveClient(
  client?: TenantQueryClient,
): Promise<TenantQueryClient | null> {
  if (client) {
    return client;
  }

  const serverClient = await getSupabaseServerClient();
  return (serverClient as unknown as TenantQueryClient | null) ?? null;
}

async function getTenantById(
  tenantId: string,
  client?: TenantQueryClient,
): Promise<Tenant | null> {
  const supabase = await resolveClient(client);

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, status, created_at, updated_at")
    .eq("id", tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Tenant;
}

async function getTenantBySlug(
  slug: string,
  client?: TenantQueryClient,
): Promise<Tenant | null> {
  const supabase = await resolveClient(client);

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, status, created_at, updated_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Tenant;
}

async function listTenantsForCurrentUser(
  client?: TenantQueryClient,
): Promise<Tenant[]> {
  const supabase = await resolveClient(client);

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, status, created_at, updated_at")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Tenant[];
}

async function listMembershipsForUser(
  userId: string,
): Promise<TenantMembership[]> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tenant_users")
    .select("tenant_id, user_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const memberships = data as TenantMembership[];
  const tenantIds = memberships.map((membership) => membership.tenant_id);

  if (tenantIds.length === 0) {
    return memberships;
  }

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, slug, name, status, created_at, updated_at")
    .in("id", tenantIds);

  const tenantMap = new Map(
    ((tenants ?? []) as Tenant[]).map((tenant) => [tenant.id, tenant]),
  );

  return memberships.map((membership) => ({
    ...membership,
    tenant: tenantMap.get(membership.tenant_id) ?? null,
  }));
}

async function getMembershipForUser(
  tenantId: string,
  userId: string,
): Promise<TenantMembership | null> {
  const memberships = await listMembershipsForUser(userId);
  return memberships.find((membership) => membership.tenant_id === tenantId) ?? null;
}

async function listMembersForTenant(
  tenantId: string,
): Promise<TenantMembership[]> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tenant_users")
    .select("tenant_id, user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const memberships = data as TenantMembership[];
  const userIds = memberships.map((membership) => membership.user_id);

  if (userIds.length === 0) {
    return memberships;
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = new Map(
    ((profiles ?? []) as NonNullable<TenantMembership["profile"]>[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return memberships.map((membership) => ({
    ...membership,
    profile: profileMap.get(membership.user_id) ?? null,
  }));
}

export const TenantService = {
  getTenantById,
  getTenantBySlug,
  listTenantsForCurrentUser,
  listMembershipsForUser,
  getMembershipForUser,
  listMembersForTenant,
};
