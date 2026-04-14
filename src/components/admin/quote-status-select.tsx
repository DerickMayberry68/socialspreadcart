"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, FileText, TrendingUp, XCircle } from "lucide-react";

import type { QuoteStatus } from "@/lib/types";

const statuses: QuoteStatus[] = ["new", "in_progress", "booked", "closed", "lost"];

const statusMeta: Record<
  QuoteStatus,
  { label: string; icon: React.ElementType; active: string; idle: string }
> = {
  new: {
    label: "New",
    icon: FileText,
    active: "border-[#e1c5a4] bg-[#f5e7d4] text-[#9a6c44]",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-[#e1c5a4] hover:bg-[#fff7ee]",
  },
  in_progress: {
    label: "In progress",
    icon: Clock3,
    active: "border-blue-200 bg-blue-50 text-blue-700",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-blue-200 hover:bg-blue-50/60",
  },
  booked: {
    label: "Booked",
    icon: CheckCircle2,
    active: "border-[#cfdcc9] bg-[#eef4e9] text-[#4f684d]",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-[#cfdcc9] hover:bg-[#f5f8f2]",
  },
  closed: {
    label: "Closed",
    icon: TrendingUp,
    active: "border-ink/10 bg-ink/10 text-ink/55",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-ink/15 hover:bg-ink/5",
  },
  lost: {
    label: "Lost",
    icon: XCircle,
    active: "border-red-200 bg-red-50 text-red-600",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-red-200 hover:bg-red-50/60",
  },
};

export function QuoteStatusSelect({
  quoteId,
  contactId,
  current,
}: {
  quoteId: string;
  contactId?: string | null;
  current: QuoteStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState<QuoteStatus | null>(null);

  const update = async (next: QuoteStatus) => {
    if (next === current || saving) return;
    setSaving(next);

    await fetch(`/api/admin/quotes/${quoteId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, contactId }),
    });

    setSaving(null);
    router.refresh();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {statuses.map((status) => {
        const meta = statusMeta[status];
        const Icon = meta.icon;
        const isActive = status === current;
        const isSaving = saving === status;

        return (
          <button
            key={status}
            disabled={Boolean(saving)}
            onClick={() => update(status)}
            className={`rounded-[20px] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive ? meta.active : meta.idle
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/70 p-2">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em]">
                  {isSaving ? "Saving" : isActive ? "Current" : "Set status"}
                </p>
                <p className="mt-1 text-sm font-medium">{meta.label}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
