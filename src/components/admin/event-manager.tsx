"use client";

import * as React from "react";
import { CalendarDays, MapPin, Pencil, Trash2, X, Plus } from "lucide-react";
import { toast } from "sonner";

import type { EventItem } from "@/lib/types";

const empty = {
  title: "",
  date: "",
  location: "",
  description: "",
  image_url: "",
  join_url: "",
};

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<EventItem>;
  onSave: (event: EventItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = React.useState({ ...empty, ...initial });
  const [saving, setSaving] = React.useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = initial?.id ? "PUT" : "POST";
    const body = initial?.id ? { id: initial.id, ...form } : form;

    const res = await fetch("/api/admin/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await res.json();
    setSaving(false);

    if (!res.ok || !payload.ok) {
      toast.error(payload.message ?? "Failed to save event.");
      return;
    }

    toast.success(initial?.id ? "Event updated." : "Event created.");
    onSave(payload.event as EventItem);
  };

  const field = (
    label: string,
    name: keyof typeof form,
    type = "text",
    required = true,
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-[0.13em] text-ink/50">
        {label}{required && " *"}
      </label>
      <input
        type={type}
        value={form[name] ?? ""}
        onChange={(e) => set(name, e.target.value)}
        required={required}
        className="w-full rounded-[12px] border border-sage/20 bg-cream px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {field("Title", "title")}
      {field("Date & Time", "date", "datetime-local")}
      {field("Location", "location")}
      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-[0.13em] text-ink/50">
          Description *
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
          rows={3}
          className="w-full resize-none rounded-[12px] border border-sage/20 bg-cream px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
        />
      </div>
      {field("Image URL", "image_url", "url", false)}
      {field("Join / RSVP URL", "join_url", "url", false)}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-sage/20 px-5 py-2 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : initial?.id ? "Update Event" : "Create Event"}
        </button>
      </div>
    </form>
  );
}

export function EventManager({ initial }: { initial: EventItem[] }) {
  const [events, setEvents] = React.useState<EventItem[]>(initial);
  const [mode, setMode] = React.useState<"idle" | "create" | "edit">("idle");
  const [editing, setEditing] = React.useState<EventItem | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const handleSave = (event: EventItem) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === event.id);
      return exists
        ? prev.map((e) => (e.id === event.id ? event : e))
        : [event, ...prev];
    });
    setMode("idle");
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch("/api/admin/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = await res.json();
    setDeleting(null);

    if (!res.ok || !payload.ok) {
      toast.error(payload.message ?? "Failed to delete event.");
      return;
    }

    toast.success("Event deleted.");
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const startEdit = (event: EventItem) => {
    setEditing(event);
    setMode("edit");
  };

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="space-y-5">
      {/* Create / form panel */}
      {mode === "idle" ? (
        <button
          onClick={() => setMode("create")}
          className="flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-medium uppercase tracking-[0.15em] text-cream shadow-soft transition hover:bg-sage-700"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      ) : (
        <div className="rounded-[20px] border border-sage/20 bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-2xl text-sage">
              {mode === "edit" ? "Edit Event" : "New Event"}
            </h2>
            <button
              onClick={() => { setMode("idle"); setEditing(null); }}
              className="rounded-full p-1.5 text-ink/40 transition hover:bg-ink/8 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <EventForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => { setMode("idle"); setEditing(null); }}
          />
        </div>
      )}

      {/* Event list */}
      <div className="rounded-[20px] border border-sage/15 bg-white shadow-soft">
        {sorted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-ink/20" />
            <p className="mt-4 text-sm text-ink/40">No events yet. Create one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-sage/8">
            {sorted.map((event) => {
              const d = new Date(event.date);
              const isPast = d < new Date();
              return (
                <li
                  key={event.id}
                  className={`flex items-start gap-4 px-6 py-4 ${isPast ? "opacity-50" : ""}`}
                >
                  {/* Date tile */}
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-[12px] bg-sage/10 py-1.5 text-center">
                    <span className="text-xs uppercase tracking-wider text-sage/70">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="font-heading text-xl text-sage">{d.getDate()}</span>
                    <span className="text-xs text-sage/60">{d.getFullYear()}</span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{event.title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                      <span>
                        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink/50">{event.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(event)}
                      className="rounded-full border border-sage/20 p-2 text-ink/50 transition hover:border-sage/40 hover:text-sage"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="rounded-full border border-red-100 p-2 text-red-400 transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
