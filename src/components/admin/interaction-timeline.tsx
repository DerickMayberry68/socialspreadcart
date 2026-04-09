"use client";

import * as React from "react";
import { MessageSquare, PhoneCall, Clock, ArrowRightLeft, FileText, PlusCircle } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Interaction, InteractionType } from "@/lib/types";

const typeConfig: Record<InteractionType, { label: string; icon: React.ElementType; color: string }> = {
  quote_submitted: { label: "Quote submitted", icon: FileText, color: "text-gold bg-gold/15" },
  contact_form: { label: "Contact form", icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
  note: { label: "Note", icon: MessageSquare, color: "text-ink/60 bg-ink/8" },
  follow_up: { label: "Follow-up", icon: PhoneCall, color: "text-sage bg-sage/15" },
  status_change: { label: "Status changed", icon: ArrowRightLeft, color: "text-ink/50 bg-ink/8" },
};

function TimelineItem({ interaction }: { interaction: Interaction }) {
  const config = typeConfig[interaction.type];
  const Icon = config.icon;

  return (
    <li className="flex gap-4">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium text-ink">{config.label}</span>
          {interaction.profile && (
            <span className="text-xs text-ink/45">by {interaction.profile.full_name}</span>
          )}
          <span className="ml-auto text-xs text-ink/35">
            {new Date(interaction.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        {interaction.body && (
          <p className="mt-1.5 rounded-[12px] bg-ink/5 px-3 py-2 text-sm text-ink/70">
            {interaction.body}
          </p>
        )}
      </div>
    </li>
  );
}

export function InteractionTimeline({
  contactId,
  initial,
}: {
  contactId: string;
  initial: Interaction[];
}) {
  const [interactions, setInteractions] = React.useState<Interaction[]>(initial);
  const [note, setNote] = React.useState("");
  const [type, setType] = React.useState<"note" | "follow_up">("note");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Not connected.");
      setSaving(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("interactions")
      .insert({ contact_id: contactId, type, body: note.trim() })
      .select("*")
      .single();

    if (err || !data) {
      setError("Failed to save. Try again.");
      setSaving(false);
      return;
    }

    setInteractions((prev) => [data as Interaction, ...prev]);
    setNote("");
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Add note form */}
      <form
        onSubmit={addNote}
        className="rounded-[16px] border border-sage/15 bg-white p-5 shadow-soft"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="h-4 w-4 shrink-0 text-sage" />
          <span className="text-sm font-medium text-ink">Add interaction</span>
        </div>
        <div className="mt-3 flex gap-2">
          {(["note", "follow_up"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.13em] transition ${
                type === t
                  ? "bg-sage text-cream"
                  : "border border-sage/20 text-ink/55 hover:border-sage/40"
              }`}
            >
              {t === "note" ? "Note" : "Follow-up"}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={type === "note" ? "Add a note…" : "Log a follow-up…"}
          rows={3}
          className="mt-3 w-full resize-none rounded-[12px] border border-sage/20 bg-cream px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving || !note.trim()}
            className="rounded-full bg-sage px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {/* Timeline */}
      {interactions.length === 0 ? (
        <div className="py-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-ink/20" />
          <p className="mt-3 text-sm text-ink/40">No interactions yet.</p>
        </div>
      ) : (
        <ul className="relative border-l border-sage/15 pl-4">
          {interactions.map((i) => (
            <TimelineItem key={i.id} interaction={i} />
          ))}
        </ul>
      )}
    </div>
  );
}
