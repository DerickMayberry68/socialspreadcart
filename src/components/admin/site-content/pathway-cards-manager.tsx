"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import type { PathwayCard } from "@/lib/types/site-content";

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45";
const inputClass =
  "w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage";
const textareaClass = `${inputClass} resize-none`;

type CardFormState = {
  display_order: 1 | 2 | 3;
  title: string;
  body: string;
  badge: string;
  link_target: string;
  image_url: string;
};

function toForm(card: PathwayCard): CardFormState {
  return {
    display_order: card.display_order,
    title: card.title,
    body: card.body,
    badge: card.badge,
    link_target: card.link_target,
    image_url: card.image_url,
  };
}

type CardsTuple = [CardFormState, CardFormState, CardFormState];

export function PathwayCardsManager({
  initial,
}: {
  initial: [PathwayCard, PathwayCard, PathwayCard];
}) {
  const [cards, setCards] = React.useState<CardsTuple>(() => [
    toForm(initial[0]),
    toForm(initial[1]),
    toForm(initial[2]),
  ]);
  const [saving, setSaving] = React.useState(false);
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(
    null,
  );
  const fileInputRefs = React.useRef<Array<HTMLInputElement | null>>([
    null,
    null,
    null,
  ]);

  const updateCard = (
    index: number,
    key: keyof Omit<CardFormState, "display_order">,
    value: string,
  ) => {
    setCards((current) => {
      const next = [...current] as CardsTuple;
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleFileSelect = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      "/api/admin/site-content/pathway-cards/upload",
      { method: "POST", body: formData },
    );
    const result = (await response.json()) as {
      ok: boolean;
      imageUrl?: string;
      message?: string;
    };

    setUploadingIndex(null);
    event.target.value = "";

    if (!response.ok || !result.ok || !result.imageUrl) {
      toast.error(result.message ?? "Failed to upload image.");
      return;
    }

    updateCard(index, "image_url", result.imageUrl);
    toast.success("Image uploaded.");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/site-content/pathway-cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    });
    const result = (await response.json()) as {
      ok: boolean;
      cards?: [PathwayCard, PathwayCard, PathwayCard];
      message?: string;
    };

    setSaving(false);

    if (!response.ok || !result.ok || !result.cards) {
      toast.error(result.message ?? "Failed to update pathway cards.");
      return;
    }

    setCards([
      toForm(result.cards[0]),
      toForm(result.cards[1]),
      toForm(result.cards[2]),
    ]);
    toast.success("Pathway cards updated. Public home page will refresh.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
          Pathway cards
        </p>
        <h2 className="mt-3 font-heading text-3xl text-[#284237]">
          Three ways visitors can say yes.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Edit the three cards that appear below the hero. Each card needs a
          title, a short body, a destination, and an image. Badges are
          optional.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {cards.map((card, index) => (
          <div
            key={card.display_order}
            className="flex flex-col gap-4 rounded-[28px] border border-sage/10 bg-white p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                Card {card.display_order}
              </p>
            </div>

            {card.image_url ? (
              <div className="overflow-hidden rounded-[22px] border border-sage/10 bg-[#fffaf4]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={card.image_url}
                    alt={card.title || `Pathway card ${card.display_order}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-[22px] border border-dashed border-sage/20 bg-[#fffaf4] text-xs uppercase tracking-[0.2em] text-ink/45">
                No image yet
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => fileInputRefs.current[index]?.click()}
                disabled={uploadingIndex !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sage/20 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                {uploadingIndex === index ? "Uploading..." : "Upload image"}
              </button>
              <input
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(index, e)}
                className="hidden"
              />
            </div>

            <label className="space-y-2">
              <span className={labelClass}>Image URL</span>
              <input
                value={card.image_url}
                onChange={(e) => updateCard(index, "image_url", e.target.value)}
                required
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Title (1-80 chars)</span>
              <input
                maxLength={80}
                value={card.title}
                onChange={(e) => updateCard(index, "title", e.target.value)}
                required
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Body (1-200 chars)</span>
              <textarea
                rows={3}
                maxLength={200}
                value={card.body}
                onChange={(e) => updateCard(index, "body", e.target.value)}
                required
                className={textareaClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Badge (optional, 0-24 chars)</span>
              <input
                maxLength={24}
                value={card.badge}
                onChange={(e) => updateCard(index, "badge", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Link target</span>
              <input
                value={card.link_target}
                onChange={(e) =>
                  updateCard(index, "link_target", e.target.value)
                }
                required
                placeholder="/menu"
                className={inputClass}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save pathway cards"}
        </button>
      </div>
    </form>
  );
}
