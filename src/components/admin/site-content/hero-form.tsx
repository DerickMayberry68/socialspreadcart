"use client";

import * as React from "react";
import { toast } from "sonner";

import type { HeroContent } from "@/lib/types/site-content";

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45";
const inputClass =
  "w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage";
const textareaClass = `${inputClass} resize-none`;

type FormState = {
  headline: string;
  sub_line: string;
  body: string;
  primary_cta_label: string;
  primary_cta_target: string;
  secondary_cta_label: string;
  secondary_cta_target: string;
};

function toFormState(hero: HeroContent): FormState {
  return {
    headline: hero.headline,
    sub_line: hero.sub_line,
    body: hero.body,
    primary_cta_label: hero.primary_cta_label,
    primary_cta_target: hero.primary_cta_target,
    secondary_cta_label: hero.secondary_cta_label,
    secondary_cta_target: hero.secondary_cta_target,
  };
}

export function HeroForm({ initial }: { initial: HeroContent }) {
  const [form, setForm] = React.useState<FormState>(() => toFormState(initial));
  const [saving, setSaving] = React.useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/site-content/hero", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = (await response.json()) as {
      ok: boolean;
      hero?: HeroContent;
      message?: string;
    };

    setSaving(false);

    if (!response.ok || !result.ok || !result.hero) {
      toast.error(result.message ?? "Failed to update hero content.");
      return;
    }

    setForm(toFormState(result.hero));
    toast.success("Hero content updated. Public home page will refresh.");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
          Hero section
        </p>
        <h2 className="mt-3 font-heading text-3xl text-[#284237]">
          The first thing your visitors read.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Keep the headline short and confident. The sub-line is optional and
          renders in the warm accent tone. Body copy should answer the
          visitor&apos;s &ldquo;so what?&rdquo; in one or two sentences.
        </p>
      </div>

      <label className="space-y-2">
        <span className={labelClass}>Headline (1-120 chars)</span>
        <textarea
          rows={2}
          maxLength={120}
          value={form.headline}
          onChange={(e) => update("headline", e.target.value)}
          required
          className={textareaClass}
        />
      </label>

      <label className="space-y-2">
        <span className={labelClass}>Sub-line (optional, up to 80 chars)</span>
        <input
          maxLength={80}
          value={form.sub_line}
          onChange={(e) => update("sub_line", e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="space-y-2">
        <span className={labelClass}>Body copy (1-400 chars)</span>
        <textarea
          rows={4}
          maxLength={400}
          value={form.body}
          onChange={(e) => update("body", e.target.value)}
          required
          className={textareaClass}
        />
      </label>

      <div className="grid gap-4 rounded-[20px] bg-[#fcf8f1] p-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClass}>Primary CTA label</span>
          <input
            maxLength={32}
            value={form.primary_cta_label}
            onChange={(e) => update("primary_cta_label", e.target.value)}
            placeholder="Start Your Order"
            className={inputClass}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClass}>Primary CTA target</span>
          <input
            value={form.primary_cta_target}
            onChange={(e) => update("primary_cta_target", e.target.value)}
            placeholder="/contact"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-[20px] bg-[#fcf8f1] p-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClass}>Secondary CTA label</span>
          <input
            maxLength={32}
            value={form.secondary_cta_label}
            onChange={(e) => update("secondary_cta_label", e.target.value)}
            placeholder="Browse the Menu"
            className={inputClass}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClass}>Secondary CTA target</span>
          <input
            value={form.secondary_cta_target}
            onChange={(e) => update("secondary_cta_target", e.target.value)}
            placeholder="/menu"
            className={inputClass}
          />
        </label>
      </div>

      <p className="text-xs text-ink/50">
        CTA targets accept site paths starting with <code>/</code>, a{" "}
        <code>tel:</code> or <code>mailto:</code> link, or a full{" "}
        <code>https://</code> URL. Leave a CTA blank to hide it.
      </p>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save hero content"}
        </button>
      </div>
    </form>
  );
}
