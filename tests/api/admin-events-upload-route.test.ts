import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseUser: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  getCurrentTenant: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  SUPABASE_SERVICE_ROLE_MISSING_MESSAGE: "Storage is unavailable.",
  getSupabaseServiceRoleClient: vi.fn(),
}));

import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { getSupabaseUser } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import { POST } from "@/app/api/admin/events/upload/route";

const tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "shayley",
  name: "Shayley",
  status: "active",
  created_at: "",
  updated_at: "",
};

describe("/api/admin/events/upload", () => {
  const upload = vi.fn();
  const getPublicUrl = vi.fn();
  const from = vi.fn(() => ({ upload, getPublicUrl }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseUser).mockResolvedValue({ id: "admin-1" } as never);
    vi.mocked(getCurrentTenant).mockResolvedValue(tenant as never);
    vi.mocked(getSupabaseServiceRoleClient).mockReturnValue({
      storage: { from },
    } as never);
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl: "https://storage.test/event-image.jpg",
      },
    });
  });

  function formDataRequest(formData: FormData) {
    return {
      formData: async () => formData,
    } as unknown as Request;
  }

  it("requires an authenticated admin user", async () => {
    vi.mocked(getSupabaseUser).mockResolvedValueOnce(null);

    const response = await POST(new Request("https://site.test/api/admin/events/upload"));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects non-image files", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["hello"], { type: "text/plain" }), "notes.txt");

    const response = await POST(formDataRequest(formData));

    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads image files to a tenant-scoped events path", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["image"], { type: "image/jpeg" }), "Mama Palooza.JPG");

    const response = await POST(formDataRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("boards");
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^11111111-1111-4111-8111-111111111111\/events\/.+mama-palooza.+\.jpg$/),
      expect.any(File),
      { contentType: "image/jpeg", upsert: false },
    );
    expect(body).toEqual({
      ok: true,
      imageUrl: "https://storage.test/event-image.jpg",
      path: expect.stringContaining(`${tenant.id}/events/`),
    });
  });
});
