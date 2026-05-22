import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("customer_reviews tenant isolation migration", () => {
  const sql = readFileSync(
    resolve(__dirname, "../supabase/migrations/20260522194923_customer_reviews.sql"),
    "utf8",
  );

  it("enables RLS and scopes admin policies to current admin tenants", () => {
    expect(sql).toContain("alter table public.customer_reviews enable row level security");
    expect(sql).toContain("customer_reviews_admin_select");
    expect(sql).toContain("customer_reviews_admin_update");
    expect(sql).toContain("tenant_id in (select public.admin_tenant_ids_for_current_user())");
  });

  it("does not create a raw public select policy for the private-field table", () => {
    expect(sql).not.toMatch(/customer_reviews_public_select/i);
    expect(sql).not.toMatch(/for select\s+to anon/i);
  });
});
