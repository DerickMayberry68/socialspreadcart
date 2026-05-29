import { describe, expect, it } from "vitest";

import {
  buildAdminListHref,
  createPagedResult,
  getPageRange,
  parseAdminListQuery,
} from "@/lib/admin/list-query";

describe("admin list query helpers", () => {
  it("normalizes search, status, sort, direction, and page", () => {
    const query = parseAdminListQuery({
      params: {
        search: "  derick  ",
        status: "closed",
        sort: "name",
        direction: "asc",
        page: "3",
      },
      allowedSorts: ["name", "created_at"] as const,
      defaultSort: "created_at",
    });

    expect(query).toMatchObject({
      search: "derick",
      status: "closed",
      sort: "name",
      direction: "asc",
      page: 3,
      pageSize: 25,
    });
  });

  it("falls back for invalid values", () => {
    const query = parseAdminListQuery({
      params: { status: "all", sort: "bad", direction: "sideways", page: "-1" },
      allowedSorts: ["created_at"] as const,
      defaultSort: "created_at",
    });

    expect(query).toEqual({
      sort: "created_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });
  });

  it("builds hrefs while preserving active query state", () => {
    expect(
      buildAdminListHref(
        "/admin/contacts",
        { search: "avery", status: "new", sort: "name", direction: "asc" },
        { page: "2" },
      ),
    ).toBe("/admin/contacts?search=avery&status=new&sort=name&direction=asc&page=2");
  });

  it("omits default page and all status values", () => {
    expect(
      buildAdminListHref(
        "/admin/contacts",
        { search: "avery", status: "all", page: "4" },
        { page: "1" },
      ),
    ).toBe("/admin/contacts?search=avery");
  });

  it("creates safe paged results and page ranges", () => {
    expect(createPagedResult(["a", "b"], 52, 9, 25)).toMatchObject({
      records: ["a", "b"],
      page: 3,
      pageCount: 3,
    });
    expect(getPageRange(5, 8)).toEqual([3, 4, 5, 6, 7]);
  });
});
