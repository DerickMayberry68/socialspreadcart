import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminPagination } from "@/components/admin/admin-pagination";

describe("AdminPagination", () => {
  it("renders active pages and preserved query links", () => {
    render(
      <AdminPagination
        pathname="/admin/contacts"
        query={{ search: "avery", sort: "name", direction: "asc" }}
        page={2}
        pageCount={4}
        pageSize={25}
        total={88}
      />,
    );

    expect(screen.getByText("Showing 26-50 of 88")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/admin/contacts?search=avery&sort=name&direction=asc",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/admin/contacts?search=avery&sort=name&direction=asc&page=3",
    );
  });
});
