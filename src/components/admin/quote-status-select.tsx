"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { QuoteStatus } from "@/lib/types";

const statuses: QuoteStatus[] = ["new", "in_progress", "booked", "closed", "lost"];

const statusStyles: Record<QuoteStatus, string> = {
  new: "bg-gold/15 text-gold border-gold/20",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  booked: "bg-sage/15 text-sage border-sage/20",
  closed: "bg-ink/10 text-ink/50 border-ink/15",
  lost: "bg-red-50 text-red-600 border-red-200",
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
  const [saving, setSaving] = React.useState(false);

  const update = async (next: QuoteStatus) => {
    if (next === current) return;
    setSaving(true);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase
        .from("quotes")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", quoteId);

      // Mirror booking status to contact if linked
      if (contactId && (next === "booked" || next === "closed")) {
        const contactStatus = next === "booked" ? "booked" : "closed";
        await supabase
          .from("contacts")
          .update({ status: contactStatus, updated_at: new Date().toISOString() })
          .eq("id", contactId);

        await supabase.from("interactions").insert({
          contact_id: contactId,
          type: "status_change",
          body: `Quote status changed to "${next.replace("_", " ")}"`,
        });
      }
    }

    setSaving(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <button
          key={s}
          disabled={saving}
          onClick={() => update(s)}
          className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize tracking-[0.13em] transition disabled:opacity-50 ${
            s === current
              ? statusStyles[s] + " shadow-soft"
              : "border-sage/20 text-ink/55 hover:border-sage/40 hover:text-ink"
          }`}
        >
          {s.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}
