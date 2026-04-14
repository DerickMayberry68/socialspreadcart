import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("@/lib/tenant/current", () => ({
  getCurrentTenant: vi.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentTenant } from "@/lib/tenant/current";
import { withCurrentTenant } from "@/lib/tenant/with";
import { ContactService } from "@/services/contact-service";
import { EventService } from "@/services/event-service";
import { InteractionService } from "@/services/interaction-service";
import { MenuService } from "@/services/menu-service";
import { submitQuote, updateQuoteStatus } from "@/services/quote-service";

const getSupabaseServerClientMock = vi.mocked(getSupabaseServerClient);
const getSupabaseServiceRoleClientMock = vi.mocked(getSupabaseServiceRoleClient);
const getCurrentTenantMock = vi.mocked(getCurrentTenant);

const TENANT_ID = "11111111-1111-4111-8111-111111111111";
const CONTACT_ID = "22222222-2222-4222-8222-222222222222";
const QUOTE_ID = "33333333-3333-4333-8333-333333333333";

function makeListQuery(result: unknown[] = []) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: result, error: null }),
    gte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: result, error: null }),
    or: vi.fn().mockReturnThis(),
  };

  return query;
}

describe("services contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("MenuService.listMenuItems scopes reads by tenant_id", async () => {
    const query = makeListQuery([{ id: "item-1", price_cents: 1200 }]);
    const serverClient = {
      from: vi.fn().mockReturnValue(query),
    };

    getSupabaseServerClientMock.mockResolvedValue(serverClient as never);

    await MenuService.listMenuItems(TENANT_ID);

    expect(serverClient.from).toHaveBeenCalledWith("menu_items");
    expect(query.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
  });

  it("EventService.createEvent validates tenantId before touching Supabase", async () => {
    await expect(
      EventService.createEvent({
        tenantId: "not-a-uuid",
        title: "Popup",
        date: "2026-04-20T12:00",
        location: "Square",
        description: "Testing",
        image_url: "",
        join_url: "",
      }),
    ).rejects.toThrow();

    expect(getSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("EventService.updateEvent writes tenant_id and filters updates by tenant_id", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "evt-1" }, error: null }),
    };
    const serverClient = {
      from: vi.fn().mockReturnValue(query),
    };

    getSupabaseServerClientMock.mockResolvedValue(serverClient as never);

    await EventService.updateEvent({
      tenantId: TENANT_ID,
      id: "evt-1",
      title: "Updated Popup",
      date: "2026-04-20T12:00",
      location: "Square",
      description: "Updated",
      image_url: "",
      join_url: "",
    });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID }),
    );
    expect(query.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
  });

  it("ContactService.updateContactStatus stamps tenant_id on contact updates and interaction inserts", async () => {
    const contactQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    contactQuery.eq
      .mockImplementationOnce(() => contactQuery)
      .mockResolvedValueOnce({ error: null });

    const interactionQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const serverClient = {
      from: vi.fn((table: string) => {
        if (table === "contacts") return contactQuery;
        if (table === "interactions") return interactionQuery;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    getSupabaseServerClientMock.mockResolvedValue(serverClient as never);

    await ContactService.updateContactStatus({
      tenantId: TENANT_ID,
      contactId: CONTACT_ID,
      status: "contacted",
      previousStatus: "new",
    });

    expect(contactQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        status: "contacted",
      }),
    );
    expect(interactionQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        contact_id: CONTACT_ID,
      }),
    );
  });

  it("InteractionService.createInteraction validates tenantId and stamps tenant_id on writes", async () => {
    const query = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "interaction-1",
          contact_id: CONTACT_ID,
          type: "note",
          created_at: "2026-04-13T00:00:00Z",
        },
        error: null,
      }),
    };
    const serverClient = {
      from: vi.fn().mockReturnValue(query),
    };

    getSupabaseServerClientMock.mockResolvedValue(serverClient as never);

    await InteractionService.createInteraction({
      tenantId: TENANT_ID,
      contactId: CONTACT_ID,
      type: "note",
      body: "Followed up",
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID }),
    );
  });

  it("submitQuote rejects malformed tenantId before hitting Supabase", async () => {
    const result = await submitQuote({
      tenantId: "bad-tenant-id",
      name: "Taylor",
      email: "taylor@example.com",
      phone: "5551234",
      eventDate: "2026-04-20",
      eventType: "Wedding",
      guests: "50",
      services: ["Charcuterie Cart"],
      message: "",
    });

    expect(result).toEqual({
      ok: false,
      message: "tenantId is invalid.",
      status: 400,
    });
    expect(getSupabaseServiceRoleClientMock).not.toHaveBeenCalled();
  });

  it("submitQuote scopes contact lookup and stamps tenant_id on quote writes", async () => {
    const contactLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const contactInsert = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: CONTACT_ID }, error: null }),
    };
    const quoteInsert = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: QUOTE_ID }, error: null }),
    };
    const interactionInsert = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const serviceClient = {
      from: vi.fn((table: string) => {
        if (table === "contacts" && contactLookup.select.mock.calls.length === 0) {
          return contactLookup;
        }
        if (table === "contacts") return contactInsert;
        if (table === "quotes") return quoteInsert;
        if (table === "interactions") return interactionInsert;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    getSupabaseServiceRoleClientMock.mockReturnValue(serviceClient as never);

    const result = await submitQuote({
      tenantId: TENANT_ID,
      name: "Taylor",
      email: "taylor@example.com",
      phone: "5551234",
      eventDate: "2026-04-20",
      eventType: "Wedding",
      guests: "50",
      services: ["Charcuterie Cart"],
      message: "",
    });

    expect(result).toEqual({ ok: true });
    expect(contactLookup.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
    expect(contactInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID }),
    );
    expect(quoteInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID }),
    );
  });

  it("updateQuoteStatus filters by tenant_id and mirrors tenant-scoped contact changes", async () => {
    const quoteQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    quoteQuery.eq
      .mockImplementationOnce(() => quoteQuery)
      .mockResolvedValueOnce({ error: null });

    const contactQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    contactQuery.eq
      .mockImplementationOnce(() => contactQuery)
      .mockResolvedValueOnce({ error: null });

    const interactionQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const serverClient = {
      from: vi.fn((table: string) => {
        if (table === "quotes") return quoteQuery;
        if (table === "contacts") return contactQuery;
        if (table === "interactions") return interactionQuery;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    getSupabaseServerClientMock.mockResolvedValue(serverClient as never);

    await updateQuoteStatus({
      tenantId: TENANT_ID,
      quoteId: QUOTE_ID,
      status: "booked",
      contactId: CONTACT_ID,
    });

    expect(quoteQuery.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
    expect(contactQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: TENANT_ID,
        status: "booked",
      }),
    );
    expect(interactionQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID }),
    );
  });

  it("withCurrentTenant passes the current tenant id into the service function", async () => {
    getCurrentTenantMock.mockResolvedValue({
      id: TENANT_ID,
      slug: "sarah",
      name: "Tenant",
      status: "active",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withCurrentTenant(fn, "search", "status");

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledWith(TENANT_ID, "search", "status");
  });
});
