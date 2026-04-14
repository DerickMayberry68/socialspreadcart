import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
  getSupabaseUser: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("@/services/email-service", () => ({
  sendTenantInvitationEmail: vi.fn(),
}));

vi.mock("@/lib/tenant/current", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("@/services/tenant-service", () => ({
  TenantService: {
    getTenantById: vi.fn(),
    getMembershipForUser: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  forbidden: vi.fn(() => {
    throw new Error("FORBIDDEN");
  }),
}));

import { getSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentTenant } from "@/lib/tenant/current";
import { requireRole } from "@/lib/auth/require-role";
import { sendTenantInvitationEmail } from "@/services/email-service";
import { InvitationService } from "@/services/invitation-service";
import { TenantService } from "@/services/tenant-service";

const getSupabaseServerClientMock = vi.mocked(getSupabaseServerClient);
const getSupabaseServiceRoleClientMock = vi.mocked(getSupabaseServiceRoleClient);
const getSupabaseUserMock = vi.mocked(getSupabaseUser);
const getCurrentTenantMock = vi.mocked(getCurrentTenant);
const sendTenantInvitationEmailMock = vi.mocked(sendTenantInvitationEmail);
const tenantServiceMock = vi.mocked(TenantService, true);

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

describe("invitation flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createInvite inserts a pending invitation and sends an email", async () => {
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "invite-1",
          tenant_id: TENANT_ID,
          email: "staff@example.com",
          role: "staff",
          token: "token",
          invited_by: USER_ID,
          status: "pending",
          expires_at: "2026-04-20T00:00:00Z",
          created_at: "2026-04-13T00:00:00Z",
          accepted_at: null,
        },
        error: null,
      }),
    };
    getSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(insertChain),
    } as never);

    const invite = await InvitationService.createInvite({
      tenantId: TENANT_ID,
      invitedBy: USER_ID,
      tenantName: "Tenant A",
      email: "staff@example.com",
      role: "staff",
      acceptUrl: "https://app.socialspreadcart.com/accept-invite",
    });

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        email: "staff@example.com",
        role: "staff",
        status: "pending",
      }),
    );
    expect(sendTenantInvitationEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantName: "Tenant A",
        email: "staff@example.com",
      }),
    );
    expect(invite.status).toBe("pending");
  });

  it("acceptInvite rejects an already accepted token", async () => {
    const eq = vi.fn().mockReturnThis();
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq,
      single: vi.fn().mockResolvedValue({
        data: {
          id: "invite-1",
          tenant_id: TENANT_ID,
          email: "staff@example.com",
          role: "staff",
          token: "abc123abc123abc123abc123abc123ab",
          invited_by: USER_ID,
          status: "accepted",
          expires_at: "2026-04-20T00:00:00Z",
          created_at: "2026-04-13T00:00:00Z",
          accepted_at: "2026-04-13T01:00:00Z",
        },
        error: null,
      }),
    };
    getSupabaseServiceRoleClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(selectChain),
    } as never);

    await expect(
      InvitationService.acceptInvite({
        token: "abc123abc123abc123abc123abc123ab",
        userId: USER_ID,
        email: "staff@example.com",
      }),
    ).rejects.toThrow("already been accepted");
  });

  it("acceptInvite creates a membership and marks the invitation accepted", async () => {
    let invitationReads = 0;
    const invitationSelect = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "invite-1",
          tenant_id: TENANT_ID,
          email: "staff@example.com",
          role: "staff",
          token: "abc123abc123abc123abc123abc123ab",
          invited_by: USER_ID,
          status: "pending",
          expires_at: "2099-04-20T00:00:00Z",
          created_at: "2026-04-13T00:00:00Z",
          accepted_at: null,
        },
        error: null,
      }),
    };
    const membershipInsert = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const invitationUpdate = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    invitationUpdate.eq
      .mockImplementationOnce(() => invitationUpdate)
      .mockResolvedValueOnce({ error: null });

    getSupabaseServiceRoleClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "tenant_invitations" && invitationReads++ === 0) {
          return invitationSelect;
        }
        if (table === "tenant_users") {
          return membershipInsert;
        }
        if (table === "tenant_invitations") {
          return invitationUpdate;
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    } as never);

    tenantServiceMock.getTenantById.mockResolvedValue({
      id: TENANT_ID,
      slug: "tenant-a",
      name: "Tenant A",
      status: "active",
      created_at: "2026-04-13T00:00:00Z",
      updated_at: "2026-04-13T00:00:00Z",
    });
    tenantServiceMock.getMembershipForUser.mockResolvedValue(null);

    const result = await InvitationService.acceptInvite({
      token: "abc123abc123abc123abc123abc123ab",
      userId: USER_ID,
      email: "staff@example.com",
    });

    expect(membershipInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        user_id: USER_ID,
        role: "staff",
      }),
    );
    expect(invitationUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "accepted",
      }),
    );
    expect(result).toEqual({ tenantId: TENANT_ID });
  });

  it("requireRole returns the current membership when the role is sufficient", async () => {
    getSupabaseUserMock.mockResolvedValue({
      id: USER_ID,
    } as never);
    getCurrentTenantMock.mockResolvedValue({
      id: TENANT_ID,
      slug: "tenant-a",
      name: "Tenant A",
      status: "active",
      created_at: "2026-04-13T00:00:00Z",
      updated_at: "2026-04-13T00:00:00Z",
    });
    tenantServiceMock.getMembershipForUser.mockResolvedValue({
      tenant_id: TENANT_ID,
      user_id: USER_ID,
      role: "owner",
      created_at: "2026-04-13T00:00:00Z",
    });

    const result = await requireRole("admin");

    expect(result).toEqual({
      tenantId: TENANT_ID,
      userId: USER_ID,
      role: "owner",
    });
  });

  it("requireRole forbids a user whose role is too low", async () => {
    getSupabaseUserMock.mockResolvedValue({
      id: USER_ID,
    } as never);
    getCurrentTenantMock.mockResolvedValue({
      id: TENANT_ID,
      slug: "tenant-a",
      name: "Tenant A",
      status: "active",
      created_at: "2026-04-13T00:00:00Z",
      updated_at: "2026-04-13T00:00:00Z",
    });
    tenantServiceMock.getMembershipForUser.mockResolvedValue({
      tenant_id: TENANT_ID,
      user_id: USER_ID,
      role: "staff",
      created_at: "2026-04-13T00:00:00Z",
    });

    await expect(requireRole("admin")).rejects.toThrow("FORBIDDEN");
  });
});
