"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { InvitationService } from "@/services/invitation-service";
import { TeamService } from "@/services/team-service";
import { getCurrentTenant } from "@/lib/tenant";

function getBaseUrl(host: string) {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function inviteMemberAction(formData: FormData) {
  const { tenantId, userId } = await requireRole("owner");
  const tenant = await getCurrentTenant();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";

  await InvitationService.createInvite({
    tenantId,
    invitedBy: userId,
    tenantName: tenant.name,
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "staff") as "owner" | "admin" | "staff",
    acceptUrl: `${getBaseUrl(host)}/accept-invite`,
  });

  revalidatePath("/admin/team");
}

export async function revokeInviteAction(formData: FormData) {
  const { tenantId } = await requireRole("owner");

  await InvitationService.revokeInvite({
    tenantId,
    inviteId: String(formData.get("inviteId") ?? ""),
  });

  revalidatePath("/admin/team");
}

export async function updateMemberRoleAction(formData: FormData) {
  const { tenantId } = await requireRole("owner");

  await TeamService.updateMemberRole({
    tenantId,
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? "staff") as "owner" | "admin" | "staff",
  });

  revalidatePath("/admin/team");
}

export async function removeMemberAction(formData: FormData) {
  const { tenantId } = await requireRole("owner");

  await TeamService.removeMember({
    tenantId,
    userId: String(formData.get("userId") ?? ""),
  });

  revalidatePath("/admin/team");
}
