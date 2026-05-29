import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminDataGrid } from "@/components/admin/admin-data-grid";

describe("AdminDataGrid", () => {
  it("renders sortable headers, muted rows, and actions", () => {
    render(
      <AdminDataGrid
        pathname="/admin/contacts"
        query={{ search: "avery" }}
        sort="name"
        direction="asc"
        columns={[
          { key: "name", label: "Customer", sortable: true },
          { key: "status", label: "Status", sortable: true },
        ]}
        rows={[
          {
            id: "1",
            state: "muted",
            cells: { name: "Avery", status: "Closed" },
            actions: <button type="button">Open</button>,
          },
        ]}
        emptyState={<p>No rows</p>}
      />,
    );

    expect(screen.getByRole("button", { name: /sort by customer/i })).toBeInTheDocument();
    expect(screen.getByText("Avery")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(
      <AdminDataGrid
        columns={[{ key: "name", label: "Customer" }]}
        rows={[]}
        emptyState={<p>No records</p>}
      />,
    );

    expect(screen.getByText("No records")).toBeInTheDocument();
  });
});
