import Link from "next/link";

export default function AwaitingInvitationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-sage/15 bg-white p-10 text-center shadow-soft">
        <h1 className="font-heading text-4xl text-sage">Awaiting Invitation</h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">
          Your account is authenticated, but it is not attached to an active tenant yet.
          Ask a tenant owner to send you an invitation, then return to accept it.
        </p>
        <Link
          href="/admin/login"
          className="mt-8 inline-flex rounded-full bg-sage px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
