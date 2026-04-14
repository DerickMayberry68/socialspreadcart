import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import type { TenantInvitation } from "@/lib/types";
import { sendTenantInvitationEmail } from "@/services/email-service";
import { TenantService } from "@/services/tenant-service";

const tenantIdSchema = z.string().uuid();

const createInviteSchema = z.object({
  tenantId: tenantIdSchema,
  invitedBy: z.string().uuid(),
  tenantName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "staff"]),
  acceptUrl: z.string().url(),
});

const revokeInviteSchema = z.object({
  tenantId: tenantIdSchema,
  inviteId: z.string().uuid(),
});

const acceptInviteSchema = z.object({
  token: z.string().min(32),
  userId: z.string().uuid(),
  email: z.string().email(),
});

function normalizeInvitation(invitation: TenantInvitation): TenantInvitation {
  if (
    invitation.status === "pending" &&
    new Date(invitation.expires_at).getTime() < Date.now()
  ) {
    return { ...invitation, status: "expired" };
  }

  return invitation;
}

async function listInvitesForTenant(
  tenantId: string,
): Promise<TenantInvitation[]> {
  tenantIdSchema.parse(tenantId);

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tenant_invitations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as TenantInvitation[]).map(normalizeInvitation);
}

async function createInvite(
  input: z.input<typeof createInviteSchema>,
): Promise<TenantInvitation> {
  const parsed = createInviteSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const invitationRecord = {
    tenant_id: parsed.tenantId,
    email: parsed.email.toLowerCase(),
    role: parsed.role,
    token: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
    invited_by: parsed.invitedBy,
    status: "pending" as const,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data, error } = await supabase
    .from("tenant_invitations")
    .insert(invitationRecord)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create invitation.");
  }

  await sendTenantInvitationEmail({
    tenantName: parsed.tenantName,
    email: invitationRecord.email,
    role: parsed.role,
    acceptUrl: `${parsed.acceptUrl}?token=${invitationRecord.token}`,
  });

  return data as TenantInvitation;
}

async function revokeInvite(
  input: z.input<typeof revokeInviteSchema>,
): Promise<void> {
  const parsed = revokeInviteSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { error } = await supabase
    .from("tenant_invitations")
    .update({ status: "revoked" })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.inviteId);

  if (error) {
    throw new Error(error.message);
  }
}

async function getInviteByToken(token: string): Promise<TenantInvitation | null> {
  const serviceClient = getSupabaseServiceRoleClient();

  if (!serviceClient) {
    return null;
  }

  const { data, error } = await serviceClient
    .from("tenant_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) {
    return null;
  }

  return normalizeInvitation(data as TenantInvitation);
}

async function acceptInvite(
  input: z.input<typeof acceptInviteSchema>,
): Promise<{ tenantId: string }> {
  const parsed = acceptInviteSchema.parse(input);
  const serviceClient = getSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("Supabase service client is unavailable.");
  }

  const invitation = await getInviteByToken(parsed.token);

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  if (invitation.status === "accepted") {
    throw new Error("This invitation has already been accepted.");
  }

  if (invitation.status === "revoked" || invitation.status === "expired") {
    throw new Error("This invitation is no longer valid.");
  }

  if (invitation.email.toLowerCase() !== parsed.email.toLowerCase()) {
    throw new Error("This invitation belongs to a different email address.");
  }

  const tenant = await TenantService.getTenantById(invitation.tenant_id);
  if (!tenant || tenant.status !== "active") {
    throw new Error("This tenant is not currently accepting logins.");
  }

  const membership = await TenantService.getMembershipForUser(
    invitation.tenant_id,
    parsed.userId,
  );

  if (!membership) {
    const { error: membershipError } = await serviceClient
      .from("tenant_users")
      .insert({
        tenant_id: invitation.tenant_id,
        user_id: parsed.userId,
        role: invitation.role,
      });

    if (membershipError) {
      throw new Error(membershipError.message);
    }
  }

  const { error: inviteError } = await serviceClient
    .from("tenant_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id)
    .eq("token", parsed.token);

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  return { tenantId: invitation.tenant_id };
}

export const InvitationService = {
  listInvitesForTenant,
  createInvite,
  revokeInvite,
  getInviteByToken,
  acceptInvite,
};
