"use client";

import * as React from "react";
import {
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
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
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={form[name] ?? ""}
        onChange={(e) => set(name, e.target.value)}
        required={required}
        className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {field("Title", "title")}
        {field("Date and time", "date", "datetime-local")}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {field("Location", "location")}
        {field("Join or RSVP URL", "join_url", "url", false)}
      </div>
      <label className="space-y-2">
        <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Description *</span>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
          rows={4}
          className="w-full resize-none rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
        />
      </label>
      {field("Image URL", "image_url", "url", false)}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-sage/20 px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : initial?.id ? "Update event" : "Create event"}
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
      const exists = prev.find((entry) => entry.id === event.id);
      return exists
        ? prev.map((entry) => (entry.id === event.id ? event : entry))
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
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const startEdit = (event: EventItem) => {
    setEditing(event);
    setMode("edit");
  };

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const upcoming = sorted.filter((event) => new Date(event.date) >= new Date()).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Event editor</p>
            <h2 className="mt-3 font-heading text-3xl text-[#284237]">
              Build the calendar with the same polish as the storefront.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-[20px] bg-[#fffaf4] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.13em] text-ink/45">Upcoming</p>
              <p className="mt-1 font-heading text-2xl text-[#284237]">{upcoming}</p>
            </div>
            <div className="rounded-[20px] bg-[#eef4e9] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.13em] text-[#4f684d]/70">Total</p>
              <p className="mt-1 font-heading text-2xl text-[#284237]">{sorted.length}</p>
            </div>
          </div>
        </div>

        {mode === "idle" ? (
          <button
            onClick={() => setMode("create")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-cream shadow-soft transition hover:bg-sage-700"
          >
            <Plus className="h-4 w-4" />
            New event
          </button>
        ) : (
          <div className="mt-6 rounded-[24px] border border-sage/10 bg-[#fcf8f1] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[#ad7a54]">
                  {mode === "edit" ? "Edit event" : "Create event"}
                </p>
                <h3 className="mt-2 font-heading text-2xl text-[#284237]">
                  {mode === "edit"
                    ? "Update the event details below."
                    : "Add a new public calendar appearance."}
                </h3>
              </div>
              <button
                onClick={() => {
                  setMode("idle");
                  setEditing(null);
                }}
                className="rounded-full border border-sage/15 bg-white p-2 text-ink/45 transition hover:border-sage/30 hover:text-sage"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <EventForm
              initial={editing ?? undefined}
              onSave={handleSave}
              onCancel={() => {
                setMode("idle");
                setEditing(null);
              }}
            />
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
          <div>
            <h2 className="font-heading text-3xl text-[#284237]">Scheduled events</h2>
            <p className="mt-1 text-sm text-ink/50">Ordered by event date for quick scanning</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#fff4ee] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#a15e50] sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Public-ready listings
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-ink/20" />
            <p className="mt-4 font-heading text-2xl text-[#284237]">No events yet.</p>
            <p className="mt-2 text-sm text-ink/45">
              Create the first event above to start populating the public calendar.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sage/8">
            {sorted.map((event) => {
              const date = new Date(event.date);
              const isPast = date < new Date();

              return (
                <li
                  key={event.id}
                  className={`flex flex-col gap-4 px-6 py-5 transition sm:flex-row sm:items-start ${
                    isPast ? "opacity-55" : "hover:bg-[#fcf8f1]"
                  }`}
                >
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-[18px] bg-[#eef4e9] py-2 text-center">
                    <span className="text-xs uppercase tracking-wider text-[#4f684d]/75">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="font-heading text-2xl text-[#284237]">{date.getDate()}</span>
                    <span className="text-xs text-[#4f684d]/70">{date.getFullYear()}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">{event.title}</p>
                      {isPast && (
                        <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs uppercase tracking-[0.12em] text-ink/50">
                          Past
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                      <span>
                        {date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/62">
                      {event.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(event)}
                      className="rounded-full border border-sage/15 bg-white p-2.5 text-ink/50 transition hover:border-sage/30 hover:text-sage"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="rounded-full border border-red-200 bg-white p-2.5 text-red-500 transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
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
      </section>
    </div>
  );
}
