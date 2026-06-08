import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ContactService } from "@/services/contact-service";

const TENANT = "11111111-1111-4111-8111-111111111111";
const CONTACT = "22222222-2222-4222-8222-222222222222";

// A chainable, awaitable query stub: methods return the same object, and
// awaiting it resolves to `result`.
function chain(result: unknown) {
  const api: Record<string, unknown> = {
    update: vi.fn(() => api),
    insert: vi.fn(() => api),
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
  return api;
}

describe("ContactService.updateContactStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cascades through the RPC when closing a contact and returns the count", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: 2, error: null }));
    const from = vi.fn(() => chain({ error: null }));
    vi.mocked(getSupabaseServerClient).mockResolvedValue({ rpc, from } as never);

    const result = await ContactService.updateContactStatus({
      tenantId: TENANT,
      contactId: CONTACT,
      status: "closed",
      previousStatus: "contacted",
    });

    expect(rpc).toHaveBeenCalledWith("close_contact_cascade", {
      p_tenant_id: TENANT,
      p_contact_id: CONTACT,
      p_previous_status: "contacted",
    });
    // Closing must go through the atomic cascade, never the plain table writes.
    expect(from).not.toHaveBeenCalled();
    expect(result).toEqual({ closedQuotes: 2 });
  });

  it("uses the plain update path for non-closed statuses and never calls the RPC", async () => {
    const rpc = vi.fn();
    const contactsQuery = chain({ error: null });
    const interactionsQuery = chain({ error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce(contactsQuery)
      .mockReturnValueOnce(interactionsQuery);
    vi.mocked(getSupabaseServerClient).mockResolvedValue({ rpc, from } as never);

    const result = await ContactService.updateContactStatus({
      tenantId: TENANT,
      contactId: CONTACT,
      status: "contacted",
      previousStatus: "new",
    });

    expect(rpc).not.toHaveBeenCalled();
    expect(contactsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "contacted", tenant_id: TENANT }),
    );
    expect(interactionsQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "status_change", contact_id: CONTACT }),
    );
    expect(result).toEqual({ closedQuotes: 0 });
  });

  it("throws when the cascade RPC errors", async () => {
    const rpc = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: "boom" } }),
    );
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      rpc,
      from: vi.fn(),
    } as never);

    await expect(
      ContactService.updateContactStatus({
        tenantId: TENANT,
        contactId: CONTACT,
        status: "closed",
      }),
    ).rejects.toThrow("boom");
  });
});
