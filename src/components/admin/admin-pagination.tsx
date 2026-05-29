import type * as React from "react";
import Link from "next/link";

import { buildAdminListHref, getPageRange } from "@/lib/admin/list-query";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  pathname: string;
  query: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
};

export function AdminPagination({
  pathname,
  query,
  page,
  pageCount,
  total,
  pageSize,
}: AdminPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = getPageRange(page, pageCount);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-sage/10 px-6 py-4 text-sm text-ink/55 md:flex-row md:items-center md:justify-between">
      <p>
        Showing {start}-{end} of {total}
      </p>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
        <PageLink
          href={buildAdminListHref(pathname, query, { page: String(page - 1) })}
          disabled={page <= 1}
        >
          Previous
        </PageLink>
        {pages.map((item) => (
          <PageLink
            key={item}
            href={buildAdminListHref(pathname, query, { page: String(item) })}
            active={item === page}
          >
            {item}
          </PageLink>
        ))}
        <PageLink
          href={buildAdminListHref(pathname, query, { page: String(page + 1) })}
          disabled={page >= pageCount}
        >
          Next
        </PageLink>
      </nav>
    </div>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-medium transition",
    active
      ? "border-sage bg-sage text-cream"
      : "border-sage/15 bg-white text-ink/60 hover:border-sage/35 hover:text-sage",
    disabled && "pointer-events-none opacity-35",
  );

  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return <Link href={href} prefetch={false} className={className}>{children}</Link>;
}
