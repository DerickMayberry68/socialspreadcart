import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-tenant-admin", () => ({
  requireTenantAdmin: vi.fn(),
}));

vi.mock("@/services/order-service", () => ({
  OrderService: {
    listOrders: vi.fn(),
    updateFulfillmentStatus: vi.fn(),
  },
}));

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { OrderService } from "@/services/order-service";
import { GET, PATCH } from "@/app/api/admin/orders/route";

const guardMock = vi.mocked(requireTenantAdmin);
const listOrdersMock = vi.mocked(OrderService.listOrders);
const updateStatusMock = vi.mocked(OrderService.updateFulfillmentStatus);

describe("/api/admin/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guardMock.mockResolvedValue({
      user: { id: "user-1" },
      tenant: {
        id: "11111111-1111-4111-8111-111111111111",
        slug: "shayley",
        name: "Shayley",
        status: "active",
        created_at: "",
        updated_at: "",
      },
    } as never);
  });

  it("lists orders scoped to the guarded tenant", async () => {
    listOrdersMock.mockResolvedValue([]);

    const response = await GET(new Request("https://site.test/api/admin/orders"));

    expect(response.status).toBe(200);
    expect(listOrdersMock).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      undefined,
    );
  });

  it("updates fulfillment status scoped to the guarded tenant", async () => {
    updateStatusMock.mockResolvedValue();

    const response = await PATCH(
      new Request("https://site.test/api/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({
          orderId: "22222222-2222-4222-8222-222222222222",
          status: "preparing",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateStatusMock).toHaveBeenCalledWith({
      tenantId: "11111111-1111-4111-8111-111111111111",
      orderId: "22222222-2222-4222-8222-222222222222",
      status: "preparing",
    });
  });
});
