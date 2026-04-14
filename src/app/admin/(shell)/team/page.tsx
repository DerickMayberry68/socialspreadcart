import { Crown, MailPlus, Shield, Users } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { InvitationService } from "@/services/invitation-service";
import { TenantService } from "@/services/tenant-service";
import {
  inviteMemberAction,
  removeMemberAction,
  revokeInviteAction,
  updateMemberRoleAction,
} from "./actions";

export default async function AdminTeamPage() {
  const { tenantId } = await requireRole("owner");
  const [members, invites] = await Promise.all([
    TenantService.listMembersForTenant(tenantId),
    InvitationService.listInvitesForTenant(tenantId),
  ]);

  const ownerCount = members.filter((member) => member.role === "owner").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-[#e4dbc9] bg-[#fffaf4] px-7 py-7 shadow-soft">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">Team access</p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.95] text-[#284237]">
            Keep the right people close to the work and the wrong people out.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/64">
            Invite collaborators, adjust roles, and manage ownership with the same clarity
            and restraint the public brand communicates to customers.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-6 py-6 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[#d7e2d4]">Active members</p>
            <p className="mt-3 font-heading text-4xl">{members.length}</p>
            <p className="mt-2 text-sm leading-7 text-[#eef2ed]/82">
              People with live access to this tenant.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-[28px] border border-sage/10 bg-white px-5 py-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.15em] text-[#ad7a54]">Owners</p>
              <p className="mt-3 font-heading text-3xl text-[#284237]">{ownerCount}</p>
            </div>
            <div className="rounded-[28px] border border-sage/10 bg-white px-5 py-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.15em] text-[#ad7a54]">Pending invites</p>
              <p className="mt-3 font-heading text-3xl text-[#284237]">{invites.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
              Invite a teammate
            </p>
            <h2 className="mt-3 font-heading text-3xl text-[#284237]">
              Send access with the right level from the start.
            </h2>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d]">
            <MailPlus className="h-3.5 w-3.5" />
            Owners can invite
          </div>
        </div>

        <form
          action={inviteMemberAction}
          className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_auto]"
        >
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="staff@example.com"
              className="w-full rounded-[16px] border border-sage/15 bg-[#fffaf4] px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:bg-white focus:ring-1 focus:ring-sage"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Role</span>
            <select
              name="role"
              defaultValue="staff"
              className="w-full rounded-[16px] border border-sage/15 bg-[#fffaf4] px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:bg-white"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-sage px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-cream transition hover:bg-sage-700 lg:self-end"
          >
            Send invite
          </button>
        </form>
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
          <div>
            <h2 className="font-heading text-3xl text-[#284237]">Members</h2>
            <p className="mt-1 text-sm text-ink/50">Current tenant access and permissions</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#fff4ee] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#a15e50] sm:flex">
            <Shield className="h-3.5 w-3.5" />
            Role managed
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          {members.map((member) => (
            <div
              key={`${member.tenant_id}-${member.user_id}`}
              className="flex flex-col gap-4 rounded-[22px] border border-sage/10 bg-[#fcf8f1] px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4e9] font-heading text-lg text-[#284237]">
                  {(member.profile?.full_name ?? member.profile?.email ?? member.user_id)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {member.profile?.full_name ?? member.user_id}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    {member.profile?.email ?? "No email on profile"}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.15em] text-[#4f684d]">
                    {member.role === "owner" && <Crown className="h-3 w-3" />}
                    {member.role}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <form action={updateMemberRoleAction} className="flex gap-2">
                  <input type="hidden" name="userId" value={member.user_id} />
                  <select
                    name="role"
                    defaultValue={member.role}
                    className="rounded-[14px] border border-sage/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-sage"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-full border border-sage/20 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40 hover:text-sage"
                  >
                    Save role
                  </button>
                </form>

                <form action={removeMemberAction}>
                  <input type="hidden" name="userId" value={member.user_id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-200 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-red-600 transition hover:border-red-300"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
          <div>
            <h2 className="font-heading text-3xl text-[#284237]">Pending invitations</h2>
            <p className="mt-1 text-sm text-ink/50">Access requests waiting to be accepted</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#4f684d] sm:flex">
            <Users className="h-3.5 w-3.5" />
            Invitation queue
          </div>
        </div>

        <div className="px-6 py-6">
          {invites.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-sage/20 bg-[#fffaf4] px-6 py-10 text-center">
              <p className="font-heading text-2xl text-[#284237]">No pending invites.</p>
              <p className="mt-2 text-sm text-ink/45">
                New invitations will appear here until they are accepted or revoked.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-4 rounded-[22px] border border-sage/10 bg-[#fcf8f1] px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{invite.email}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {invite.role} | {invite.status} | expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-red-600 transition hover:border-red-300"
                    >
                      Revoke
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
