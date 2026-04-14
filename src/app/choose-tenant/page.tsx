import { redirect } from "next/navigation";

import { getSupabaseUser } from "@/lib/supabase/server";
import { setActiveTenantId } from "@/lib/tenant";
import { TenantService } from "@/services/tenant-service";
import { selectTenantAction } from "./actions";

export default async function ChooseTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const user = await getSupabaseUser();
  const params = await searchParams;
  const returnUrl = params.returnUrl ?? "/admin";

  if (!user) {
    redirect(`/admin/login?returnUrl=${encodeURIComponent("/choose-tenant")}`);
  }

  const memberships = (await TenantService.listMembershipsForUser(user.id)).filter(
    (membership) => membership.tenant?.status === "active",
  );

  if (memberships.length === 0) {
    redirect("/awaiting-invitation");
  }

  if (memberships.length === 1) {
    await setActiveTenantId(memberships[0].tenant_id);
    redirect(returnUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl rounded-[32px] border border-sage/15 bg-white p-8 shadow-soft">
        <h1 className="font-heading text-4xl text-sage">Choose Tenant</h1>
        <p className="mt-2 text-sm text-ink/55">
          Your account belongs to more than one tenant. Select the workspace you want
          to manage for this session.
        </p>

        <div className="mt-8 grid gap-4">
          {memberships.map((membership) => (
            <form
              key={`${membership.tenant_id}-${membership.user_id}`}
              action={selectTenantAction}
              className="flex items-center justify-between rounded-[20px] border border-sage/15 bg-cream px-5 py-4"
            >
              <div>
                <p className="font-heading text-2xl text-sage">
                  {membership.tenant?.name ?? membership.tenant_id}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-ink/45">
                  {membership.role}
                </p>
              </div>
              <input type="hidden" name="tenantId" value={membership.tenant_id} />
              <input type="hidden" name="returnUrl" value={returnUrl} />
              <button
                type="submit"
                className="rounded-full bg-sage px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700"
              >
                Open
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
