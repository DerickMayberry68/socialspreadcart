import type { AdminListQuery, PagedResult, SortDirection } from "@/lib/types";

export const DEFAULT_ADMIN_PAGE_SIZE = 25;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type SearchParamsLike = Record<string, string | string[] | undefined>;

type ParseAdminListQueryOptions<TSort extends string> = {
  params: SearchParamsLike;
  allowedSorts: readonly TSort[];
  defaultSort: TSort;
  defaultDirection?: SortDirection;
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseAdminListQuery<TSort extends string>({
  params,
  allowedSorts,
  defaultSort,
  defaultDirection = "desc",
  defaultPageSize = DEFAULT_ADMIN_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: ParseAdminListQueryOptions<TSort>): AdminListQuery<TSort> {
  const rawSearch = firstParam(params.search)?.trim();
  const rawStatus = firstParam(params.status)?.trim();
  const rawSort = firstParam(params.sort)?.trim() as TSort | undefined;
  const rawDirection = firstParam(params.direction)?.trim();
  const rawPageSize = normalizePositiveInt(firstParam(params.pageSize), defaultPageSize);

  const sort = rawSort && allowedSorts.includes(rawSort) ? rawSort : defaultSort;
  const direction: SortDirection = rawDirection === "asc" || rawDirection === "desc"
    ? rawDirection
    : defaultDirection;
  const pageSize = pageSizeOptions.includes(rawPageSize)
    ? rawPageSize
    : defaultPageSize;

  return {
    ...(rawSearch ? { search: rawSearch } : {}),
    ...(rawStatus && rawStatus !== "all" ? { status: rawStatus } : {}),
    sort,
    direction,
    page: normalizePositiveInt(firstParam(params.page), 1),
    pageSize,
  };
}

export function createPagedResult<T>(
  records: T[],
  total: number,
  page: number,
  pageSize: number,
): PagedResult<T> {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  return {
    records,
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

export function buildAdminListHref(
  pathname: string,
  current: SearchParamsLike,
  updates: SearchParamsLike,
): string {
  const params = new URLSearchParams();
  const merged: SearchParamsLike = { ...current, ...updates };

  Object.entries(merged).forEach(([key, value]) => {
    const actual = firstParam(value);
    if (!actual || actual === "all" || (key === "page" && actual === "1")) {
      return;
    }
    params.set(key, actual);
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getPageRange(page: number, pageCount: number): number[] {
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}
