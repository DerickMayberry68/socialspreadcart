"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type FieldErrors = Partial<Record<"displayName" | "rating" | "reviewText" | "occasion" | "customerEmail" | "customerPhone", string[]>>;

export function ReviewForm() {
  const [rating, setRating] = React.useState(5);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: formData.get("displayName"),
        rating,
        reviewText: formData.get("reviewText"),
        occasion: formData.get("occasion"),
        customerEmail: formData.get("customerEmail"),
        customerPhone: formData.get("customerPhone"),
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      setStatus("error");
      setMessage(result.message ?? "Review could not be submitted right now.");
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    form.reset();
    setRating(5);
    setStatus("success");
    setMessage(result.message ?? "Review submitted for approval.");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[36px] border border-sage/25 bg-gradient-to-br from-white/72 via-[#f8f1e3]/60 to-[#dfe8d8]/68 p-6 shadow-[0_28px_70px_rgba(56,66,44,0.22)] backdrop-blur-xl sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink/72">
          Display name
          <input
            name="displayName"
            className="mt-2 w-full rounded-[18px] border border-sage/25 bg-white/80 px-4 py-3 text-ink shadow-soft outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            autoComplete="name"
          />
          {fieldErrors.displayName ? <FieldError message={fieldErrors.displayName[0]} /> : null}
        </label>
        <label className="text-sm font-medium text-ink/72">
          Occasion or service
          <input
            name="occasion"
            className="mt-2 w-full rounded-[18px] border border-sage/25 bg-white/80 px-4 py-3 text-ink shadow-soft outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            placeholder="Shower, party, pickup..."
          />
        </label>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink/72">Rating</p>
        <div className="mt-2 flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-full border border-sage/20 bg-white/75 p-2 text-[#b8562e] shadow-soft transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sage/30"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Sparkles className={`h-5 w-5 ${value <= rating ? "fill-current" : "opacity-30"}`} />
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-5 block text-sm font-medium text-ink/72">
        Review
        <textarea
          name="reviewText"
          rows={6}
          className="mt-2 w-full rounded-[22px] border border-sage/25 bg-white/80 px-4 py-3 text-ink shadow-soft outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
          placeholder="Tell us what you loved..."
        />
        {fieldErrors.reviewText ? <FieldError message={fieldErrors.reviewText[0]} /> : null}
      </label>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink/72">
          Email for follow-up
          <input
            name="customerEmail"
            type="email"
            className="mt-2 w-full rounded-[18px] border border-sage/25 bg-white/80 px-4 py-3 text-ink shadow-soft outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            autoComplete="email"
          />
          {fieldErrors.customerEmail ? <FieldError message={fieldErrors.customerEmail[0]} /> : null}
        </label>
        <label className="text-sm font-medium text-ink/72">
          Phone, optional
          <input
            name="customerPhone"
            className="mt-2 w-full rounded-[18px] border border-sage/25 bg-white/80 px-4 py-3 text-ink shadow-soft outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
            autoComplete="tel"
          />
        </label>
      </div>

      {message ? (
        <p
          className={`mt-5 rounded-[18px] px-4 py-3 text-sm ${
            status === "success"
              ? "border border-sage/20 bg-[#eef4e9] text-sage"
              : "border border-[#e8b896] bg-[#fce1d2] text-[#8c5a36]"
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button className="mt-6" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-xs text-[#8c5a36]">{message}</p>;
}
