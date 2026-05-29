"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SortDirection } from "@/lib/types";

type AdminSortHeaderButtonProps = {
  href: string;
  label: string;
  isSorted: boolean;
  direction: SortDirection;
  className?: string;
};

export function AdminSortHeaderButton({
  href,
  label,
  isSorted,
  direction,
  className,
}: AdminSortHeaderButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={`Sort by ${label}`}
      onClick={() => router.push(href, { scroll: false })}
      className={cn(
        "inline-flex w-full items-center gap-1 bg-transparent p-0 text-left uppercase tracking-[0.13em] transition hover:text-sage",
        className,
      )}
    >
      {label}
      {isSorted ? (
        direction === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : null}
    </button>
  );
}
