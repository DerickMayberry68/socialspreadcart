"use client";

import * as React from "react";
import {
  ArrowRightLeft,
  Clock,
  FileText,
  MessageSquare,
  PhoneCall,
  PlusCircle,
} from "lucide-react";

import type { Interaction, InteractionType } from "@/lib/types";

const typeConfig: Record<
  InteractionType,
  { label: string; icon: React.ElementType; color: string }
> = {
  quote_submitted: {
    label: "Quote submitted",
    icon: FileText,
    color: "text-[#9a6c44] bg-[#f5e7d4]",
  },
  contact_form: {
    label: "Contact form",
    icon: MessageSquare,
    color: "text-blue-700 bg-blue-50",
  },
  note: {
    label: "Note",
    icon: MessageSquare,
    color: "text-ink/60 bg-ink/8",
  },
  follow_up: {
    label: "Follow-up",
    icon: PhoneCall,
    color: "text-[#4f684d] bg-[#eef4e9]",
  },
  status_change: {
    label: "Status changed",
    icon: ArrowRightLeft,
    color: "text-ink/50 bg-ink/8",
  },
};

function TimelineItem({ interaction }: { interaction: Interaction }) {
  const config = typeConfig[interaction.type];
  const Icon = config.icon;

  return (
    <li className="relative pl-12">
      <span className="absolute left-[15px] top-12 h-full w-px bg-sage/15" />
      <div
        className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-sm ${config.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-[20px] border border-sage/10 bg-[#fcf8f1] px-4 py-4">
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
          <p className="mt-3 rounded-[16px] bg-white px-4 py-3 text-sm leading-7 text-ink/72">
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

    const response = await fetch(`/api/admin/contacts/${contactId}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, body: note.trim() }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      interaction?: Interaction;
      message?: string;
    };

    if (!response.ok || !payload.ok || !payload.interaction) {
      setError(payload.message ?? "Failed to save. Try again.");
      setSaving(false);
      return;
    }

    setInteractions((prev) => [payload.interaction as Interaction, ...prev]);
    setNote("");
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addNote} className="rounded-[24px] border border-sage/10 bg-[#fffaf4] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-2 shadow-soft">
            <PlusCircle className="h-4 w-4 text-[#4f684d]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/45">Add interaction</p>
            <p className="mt-1 text-sm text-ink/62">
              Capture context while it is fresh.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {(["note", "follow_up"] as const).map((entryType) => (
            <button
              key={entryType}
              type="button"
              onClick={() => setType(entryType)}
              className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.13em] transition ${
                type === entryType
                  ? "bg-sage text-cream"
                  : "border border-sage/20 bg-white text-ink/55 hover:border-sage/40"
              }`}
            >
              {entryType === "note" ? "Note" : "Follow-up"}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={type === "note" ? "Add a note..." : "Log a follow-up..."}
          rows={4}
          className="mt-4 w-full resize-none rounded-[18px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving || !note.trim()}
            className="rounded-full bg-sage px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save note"}
          </button>
        </div>
      </form>

      {interactions.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-sage/20 bg-white px-6 py-10 text-center">
          <Clock className="mx-auto h-8 w-8 text-ink/20" />
          <p className="mt-3 font-heading text-2xl text-[#284237]">No interactions yet.</p>
          <p className="mt-2 text-sm text-ink/45">
            Add the first note or follow-up to start the relationship timeline.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {interactions.map((interaction, index) => (
            <li key={interaction.id} className={index === interactions.length - 1 ? "[&>div>span]:hidden" : ""}>
              <TimelineItem interaction={interaction} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
