import type * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { buildAdminListHref } from "@/lib/admin/list-query";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/lib/types";

export type AdminDataGridColumn<TSort extends string = string> = {
  key: string;
  label: string;
  sortable?: boolean;
  sortKey?: TSort;
  align?: "left" | "center" | "right";
  className?: string;
};

export type AdminDataGridRow = {
  id: string;
  href?: string;
  state?: "active" | "muted" | "warning";
  cells: Record<string, React.ReactNode>;
  actions?: React.ReactNode;
};

type AdminDataGridProps<TSort extends string = string> = {
  columns: Array<AdminDataGridColumn<TSort>>;
  rows: AdminDataGridRow[];
  pathname?: string;
  query?: Record<string, string | undefined>;
  sort?: TSort;
  direction?: SortDirection;
  emptyState: React.ReactNode;
  minWidthClassName?: string;
};

function alignmentClass(align?: "left" | "center" | "right") {
  if (align === "right") return "text-right justify-end";
  if (align === "center") return "text-center justify-center";
  return "text-left justify-start";
}

export function AdminDataGrid<TSort extends string = string>({
  columns,
  rows,
  pathname,
  query = {},
  sort,
  direction = "desc",
  emptyState,
  minWidthClassName = "min-w-[900px]",
}: AdminDataGridProps<TSort>) {
  if (rows.length === 0) {
    return <>{emptyState}</>;
  }

  const gridTemplateColumns = `${columns.map(() => "minmax(0, 1fr)").join(" ")} 120px`;

  return (
    <div className="overflow-x-auto">
      <div className={cn("w-full", minWidthClassName)}>
        <div
          className="grid gap-4 border-b border-sage/10 bg-[#fffaf4] px-6 py-3 text-xs uppercase tracking-[0.13em] text-ink/45"
          style={{ gridTemplateColumns }}
        >
          {columns.map((column) => {
            const sortKey = column.sortKey ?? (column.key as TSort);
            const isSorted = sort === sortKey;
            const nextDirection: SortDirection = isSorted && direction === "asc" ? "desc" : "asc";
            const content = (
              <span className={cn("inline-flex items-center gap-1", alignmentClass(column.align))}>
                {column.label}
                {isSorted ? (
                  direction === "asc" ? (
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  )
                ) : null}
              </span>
            );

            if (!column.sortable || !pathname) {
              return (
                <div key={column.key} className={cn(alignmentClass(column.align), column.className)}>
                  {content}
                </div>
              );
            }

            return (
              <a
                key={column.key}
                href={buildAdminListHref(pathname, query, {
                  sort: sortKey,
                  direction: nextDirection,
                  page: "1",
                })}
                className={cn(
                  "transition hover:text-sage",
                  alignmentClass(column.align),
                  column.className,
                )}
              >
                {content}
              </a>
            );
          })}
          <div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-sage/8">
          {rows.map((row) => {
            const rowClassName = cn(
              "grid gap-4 px-6 py-5 text-sm transition",
              row.state === "muted"
                ? "bg-ink/[0.025] text-ink/55"
                : row.state === "warning"
                  ? "bg-[#fff4ee] text-ink"
                  : "text-ink hover:bg-[#fcf8f1]",
            );

            const cells = columns.map((column) => (
              <div
                key={`${row.id}-${column.key}`}
                className={cn("min-w-0", alignmentClass(column.align), column.className)}
              >
                {row.cells[column.key]}
              </div>
            ));

            if (row.href) {
              return (
                <div
                  key={row.id}
                  className={rowClassName}
                  style={{ gridTemplateColumns }}
                >
                  {cells.map((cell, index) => (
                    <a
                      key={`${row.id}-link-${columns[index].key}`}
                      href={row.href ?? "#"}
                      className="min-w-0"
                    >
                      {cell}
                    </a>
                  ))}
                  <div className="flex justify-end gap-2">{row.actions}</div>
                </div>
              );
            }

            return (
              <div
                key={row.id}
                className={rowClassName}
                style={{ gridTemplateColumns }}
              >
                {cells}
                <div className="flex justify-end gap-2">{row.actions}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
