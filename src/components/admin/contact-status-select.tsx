"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Inbox, PhoneCall, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ContactStatus } from "@/lib/types";

const statuses: ContactStatus[] = ["new", "contacted", "booked", "closed"];

const statusMeta: Record<
  ContactStatus,
  { label: string; icon: React.ElementType; active: string; idle: string }
> = {
  new: {
    label: "New",
    icon: Inbox,
    active: "border-[#e1c5a4] bg-[#f5e7d4] text-[#9a6c44]",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-[#e1c5a4] hover:bg-[#fff7ee]",
  },
  contacted: {
    label: "Contacted",
    icon: PhoneCall,
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
    icon: Users,
    active: "border-ink/10 bg-ink/10 text-ink/55",
    idle: "border-sage/15 bg-white text-ink/60 hover:border-ink/15 hover:bg-ink/5",
  },
};

export function ContactStatusSelect({
  contactId,
  current,
  openQuotesCount = 0,
}: {
  contactId: string;
  current: ContactStatus;
  openQuotesCount?: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState<ContactStatus | null>(null);
  const [confirmingClose, setConfirmingClose] = React.useState(false);

  const performUpdate = async (next: ContactStatus) => {
    setSaving(next);

    try {
      const response = await fetch(`/api/admin/contacts/${contactId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, previousStatus: current }),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok: boolean; closedQuotes?: number; message?: string }
        | null;

      if (!response.ok || !result?.ok) {
        toast.error(result?.message ?? "Status could not be updated.");
        return;
      }

      if (next === "closed" && result.closedQuotes && result.closedQuotes > 0) {
        toast.success(
          `Contact closed. ${result.closedQuotes} related ${
            result.closedQuotes === 1 ? "quote was" : "quotes were"
          } also closed.`,
        );
      } else {
        toast.success("Contact status updated.");
      }

      router.refresh();
    } finally {
      setSaving(null);
    }
  };

  const update = (next: ContactStatus) => {
    if (next === current || saving) return;

    // Closing a contact cuts ties and voids its open quotes — confirm first.
    if (next === "closed" && openQuotesCount > 0) {
      setConfirmingClose(true);
      return;
    }

    void performUpdate(next);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ConfirmDialog
        open={confirmingClose}
        onOpenChange={setConfirmingClose}
        title="Close this contact?"
        description={`This contact has ${openQuotesCount} open ${
          openQuotesCount === 1 ? "quote" : "quotes"
        }. Closing the contact will also close ${
          openQuotesCount === 1 ? "it" : "them"
        }. This is for cutting ties — to close a single quote, do it from that quote instead.`}
        confirmLabel="Close contact & quotes"
        onConfirm={() => void performUpdate("closed")}
      />
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
