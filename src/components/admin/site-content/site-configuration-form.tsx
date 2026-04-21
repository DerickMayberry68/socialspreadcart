"use client";

import * as React from "react";
import { toast } from "sonner";

import type { SiteConfiguration } from "@/lib/types/site-content";

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45";
const inputClass =
  "w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage";

type FormState = {
  brand_name: string;
  brand_tagline: string;
  booking_cta_label: string;
  booking_cta_target: string;
  support_phone: string;
  support_email: string;
};

function toFormState(config: SiteConfiguration): FormState {
  return {
    brand_name: config.brand_name,
    brand_tagline: config.brand_tagline,
    booking_cta_label: config.booking_cta_label,
    booking_cta_target: config.booking_cta_target,
    support_phone: config.support_phone ?? "",
    support_email: config.support_email ?? "",
  };
}

export function SiteConfigurationForm({
  initial,
}: {
  initial: SiteConfiguration;
}) {
  const [form, setForm] = React.useState<FormState>(() => toFormState(initial));
  const [saving, setSaving] = React.useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/site-content/configuration", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = (await response.json()) as {
      ok: boolean;
      config?: SiteConfiguration;
      message?: string;
    };

    setSaving(false);

    if (!response.ok || !result.ok || !result.config) {
      toast.error(result.message ?? "Failed to update site configuration.");
      return;
    }

    setForm(toFormState(result.config));
    toast.success(
      "Site configuration updated. Header, footer, and CTAs will refresh.",
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
          Site configuration
        </p>
        <h2 className="mt-3 font-heading text-3xl text-[#284237]">
          Brand identity and booking call-to-action.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          These values show up across every page: site header, footer, and any
          primary &ldquo;book&rdquo; button. Changes take effect immediately.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClass}>Brand name (1-80 chars)</span>
          <input
            maxLength={80}
            value={form.brand_name}
            onChange={(e) => update("brand_name", e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClass}>Tagline (optional, up to 140 chars)</span>
          <input
            maxLength={140}
            value={form.brand_tagline}
            onChange={(e) => update("brand_tagline", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-[20px] bg-[#fcf8f1] p-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClass}>Booking CTA label (1-32 chars)</span>
          <input
            maxLength={32}
            value={form.booking_cta_label}
            onChange={(e) => update("booking_cta_label", e.target.value)}
            required
            placeholder="Book the Cart"
            className={inputClass}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClass}>Booking CTA target</span>
          <input
            value={form.booking_cta_target}
            onChange={(e) => update("booking_cta_target", e.target.value)}
            required
            placeholder="/contact"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClass}>Support phone (optional)</span>
          <input
            maxLength={32}
            value={form.support_phone}
            onChange={(e) => update("support_phone", e.target.value)}
            placeholder="(870) 654-3732"
            className={inputClass}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClass}>Support email (optional)</span>
          <input
            type="email"
            maxLength={254}
            value={form.support_email}
            onChange={(e) => update("support_email", e.target.value)}
            placeholder="hello@yourbrand.com"
            className={inputClass}
          />
        </label>
      </div>

      <p className="text-xs text-ink/50">
        The booking CTA target accepts site paths starting with <code>/</code>,
        a <code>tel:</code> or <code>mailto:</code> link, or a full{" "}
        <code>https://</code> URL.
      </p>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-sage px-6 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save configuration"}
        </button>
      </div>
    </form>
  );
}
