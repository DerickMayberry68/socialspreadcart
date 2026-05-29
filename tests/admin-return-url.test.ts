import { describe, expect, it } from "vitest";

import { normalizeAdminReturnUrl } from "@/lib/navigation/admin-return-url";

describe("normalizeAdminReturnUrl", () => {
  it("keeps internal admin paths", () => {
    expect(normalizeAdminReturnUrl("/admin/orders?status=new")).toBe(
      "/admin/orders?status=new",
    );
  });

  it("falls back for non-admin values", () => {
    expect(normalizeAdminReturnUrl("/choose-tenant")).toBe("/admin");
    expect(normalizeAdminReturnUrl("/administrator")).toBe("/admin");
    expect(normalizeAdminReturnUrl("https://example.com/admin")).toBe("/admin");
    expect(normalizeAdminReturnUrl(undefined)).toBe("/admin");
  });
});
