"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ContactStatus } from "@/lib/types";

const statuses: ContactStatus[] = ["new", "contacted", "booked", "closed"];

export function ContactStatusSelect({
  contactId,
  current,
}: {
  contactId: string;
  current: ContactStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const update = async (next: ContactStatus) => {
    if (next === current) return;
    setSaving(true);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase
        .from("contacts")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", contactId);

      // Log the status change
      await supabase.from("interactions").insert({
        contact_id: contactId,
        type: "status_change",
        body: `Status changed from "${current}" to "${next}"`,
      });
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
          className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.13em] transition disabled:opacity-50 ${
            s === current
              ? "bg-sage text-cream shadow-soft"
              : "border border-sage/20 text-ink/55 hover:border-sage/40 hover:text-ink"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
