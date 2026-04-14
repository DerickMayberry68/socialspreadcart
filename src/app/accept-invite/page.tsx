import Link from "next/link";
import { redirect } from "next/navigation";

import { getSupabaseUser } from "@/lib/supabase/server";
import { InvitationService } from "@/services/invitation-service";
import { acceptInvitationAction } from "./actions";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-[28px] border border-sage/15 bg-white p-10 text-center shadow-soft">
          <h1 className="font-heading text-4xl text-sage">Invitation Missing</h1>
          <p className="mt-3 text-sm text-ink/55">
            This invitation link is incomplete. Request a fresh invitation from a tenant owner.
          </p>
        </div>
      </div>
    );
  }

  const invite = await InvitationService.getInviteByToken(token);

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-[28px] border border-sage/15 bg-white p-10 text-center shadow-soft">
          <h1 className="font-heading text-4xl text-sage">Invitation Not Found</h1>
          <p className="mt-3 text-sm text-ink/55">
            This invitation is invalid, revoked, or has already been removed.
          </p>
        </div>
      </div>
    );
  }

  if (invite.status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-[28px] border border-sage/15 bg-white p-10 text-center shadow-soft">
          <h1 className="font-heading text-4xl text-sage">Invitation Accepted</h1>
          <p className="mt-3 text-sm text-ink/55">
            This invitation has already been used. Sign in to continue to your admin workspace.
          </p>
          <Link
            href="/admin/login"
            className="mt-8 inline-flex rounded-full bg-sage px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (invite.status === "expired" || invite.status === "revoked") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-[28px] border border-sage/15 bg-white p-10 text-center shadow-soft">
          <h1 className="font-heading text-4xl text-sage">Invitation Expired</h1>
          <p className="mt-3 text-sm text-ink/55">
            This invitation is no longer active. Ask a tenant owner to send a new one.
          </p>
        </div>
      </div>
    );
  }

  const user = await getSupabaseUser();

  if (!user) {
    redirect(`/admin/login?returnUrl=${encodeURIComponent(`/accept-invite?token=${token}`)}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-sage/15 bg-white p-10 shadow-soft">
        <h1 className="font-heading text-4xl text-sage">Accept Invitation</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          You&apos;re signed in as <span className="font-medium">{user.email}</span>. Accept this
          invitation to join the tenant as <span className="font-medium">{invite.role}</span>.
        </p>

        <form action={acceptInvitationAction} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="rounded-full bg-sage px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700"
          >
            Accept Invitation
          </button>
        </form>
      </div>
    </div>
  );
}
