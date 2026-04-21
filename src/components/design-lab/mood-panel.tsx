import { ArrowRight } from "lucide-react";

export type Swatch = {
  name: string;
  hex: string;
  role?: string;
};

export type Mood = {
  id: "whitewashed" | "walnut" | "rustic-mix";
  title: string;
  tagline: string;
  woodClass: "wood-whitewashed" | "wood-walnut" | "wood-driftwood";
  pageBg: string;
  surface: string;
  cardSurface: string;
  textPrimary: string;
  textMuted: string;
  eyebrow: string;
  accentSolid: string;
  accentSoft: string;
  accentContrast: string;
  buttonBg: string;
  buttonText: string;
  buttonGhostBorder: string;
  buttonGhostText: string;
  shadow: string;
  swatches: Swatch[];
  pathwayAccent: string;
  heroTexture?: "panel" | "trim";
};

export function MoodPanel({ mood }: { mood: Mood }) {
  return (
    <section
      className="flex flex-col gap-6 rounded-[32px] border p-6"
      style={{
        background: mood.pageBg,
        borderColor: `${mood.accentSolid}26`,
        boxShadow: mood.shadow,
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-[0.22em]"
            style={{ color: mood.eyebrow }}
          >
            Mood option
          </p>
          <h2
            className="mt-2 font-heading text-3xl leading-tight"
            style={{ color: mood.textPrimary }}
          >
            {mood.title}
          </h2>
          <p
            className="mt-2 max-w-md text-sm leading-6"
            style={{ color: mood.textMuted }}
          >
            {mood.tagline}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: `${mood.accentSolid}1f`,
            color: mood.accentContrast,
          }}
        >
          {mood.id}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {mood.swatches.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-2xl border p-3"
            style={{
              background: mood.cardSurface,
              borderColor: `${mood.accentSolid}1f`,
            }}
          >
            <span
              className="h-9 w-9 shrink-0 rounded-full border"
              style={{
                background: s.hex,
                borderColor: "rgba(0,0,0,0.08)",
              }}
              aria-hidden
            />
            <div className="min-w-0">
              <p
                className="truncate text-[11px] font-medium uppercase tracking-[0.12em]"
                style={{ color: mood.textPrimary }}
              >
                {s.name}
              </p>
              <p
                className="text-[10px] tabular-nums"
                style={{ color: mood.textMuted }}
              >
                {s.hex}
                {s.role ? ` · ${s.role}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`relative overflow-hidden rounded-[24px] border p-6 ${
          mood.heroTexture === "panel" ? mood.woodClass : ""
        }`}
        style={{
          background:
            mood.heroTexture === "panel" ? undefined : mood.surface,
          borderColor: `${mood.accentSolid}26`,
          color:
            mood.heroTexture === "panel" ? "#f8f1e3" : mood.textPrimary,
        }}
      >
        {mood.heroTexture === "trim" ? (
          <div
            className={`absolute inset-x-0 top-0 h-[10px] ${mood.woodClass}`}
            aria-hidden
          />
        ) : null}
        <p
          className="text-xs uppercase tracking-[0.22em]"
          style={{
            color:
              mood.heroTexture === "panel"
                ? "rgba(248,241,227,0.75)"
                : mood.eyebrow,
          }}
        >
          Sample hero
        </p>
        <h3
          className="mt-3 font-heading text-3xl leading-[1.05]"
          style={{
            color:
              mood.heroTexture === "panel" ? "#fdf6e9" : mood.textPrimary,
          }}
        >
          Gather, grazing boards, and good company.
        </h3>
        <p
          className="mt-3 max-w-md text-sm leading-6"
          style={{
            color:
              mood.heroTexture === "panel"
                ? "rgba(248,241,227,0.82)"
                : mood.textMuted,
          }}
        >
          Styled charcuterie, colorful carts, and pop-ups built for
          Northwest Arkansas hosts who want something warmer than a tray.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] transition"
            style={{
              background: mood.buttonBg,
              color: mood.buttonText,
            }}
          >
            Book a cart
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs uppercase tracking-[0.16em] transition"
            style={{
              borderColor: mood.buttonGhostBorder,
              color:
                mood.heroTexture === "panel"
                  ? "#fdf6e9"
                  : mood.buttonGhostText,
            }}
          >
            See the menu
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <article
          className="relative overflow-hidden rounded-[22px] border"
          style={{
            background: mood.cardSurface,
            borderColor: `${mood.accentSolid}24`,
          }}
        >
          <div
            className="h-24 w-full"
            style={{ background: mood.pathwayAccent }}
          />
          <div className="p-5">
            <span
              className="inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
              style={{
                background: `${mood.accentSolid}1f`,
                color: mood.accentContrast,
              }}
            >
              Event favorite
            </span>
            <h4
              className="mt-3 font-heading text-xl leading-tight"
              style={{ color: mood.textPrimary }}
            >
              Cart service that becomes part of the decor
            </h4>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: mood.textMuted }}
            >
              A styled setup for showers, weddings, and community activations
              that deserve a focal point.
            </p>
          </div>
        </article>

        <article
          className="flex flex-col gap-4 rounded-[22px] border p-5"
          style={{
            background: mood.cardSurface,
            borderColor: `${mood.accentSolid}24`,
          }}
        >
          <p
            className="text-xs uppercase tracking-[0.18em]"
            style={{ color: mood.eyebrow }}
          >
            Quote form
          </p>
          <label className="flex flex-col gap-2 text-xs">
            <span
              className="uppercase tracking-[0.14em]"
              style={{ color: mood.textMuted }}
            >
              Event date
            </span>
            <input
              type="text"
              defaultValue="Saturday, May 18"
              className="rounded-[14px] border px-4 py-3 text-sm outline-none"
              style={{
                background: "#ffffff",
                borderColor: `${mood.accentSolid}33`,
                color: mood.textPrimary,
              }}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs">
            <span
              className="uppercase tracking-[0.14em]"
              style={{ color: mood.textMuted }}
            >
              Headcount
            </span>
            <input
              type="text"
              defaultValue="60 guests"
              className="rounded-[14px] border px-4 py-3 text-sm outline-none"
              style={{
                background: "#ffffff",
                borderColor: `${mood.accentSolid}33`,
                color: mood.textPrimary,
              }}
            />
          </label>
          <button
            type="button"
            className="mt-1 self-start rounded-full px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em]"
            style={{
              background: mood.accentSolid,
              color: "#fdf6e9",
            }}
          >
            Request a quote
          </button>
        </article>
      </div>

      <div>
        <p
          className="mb-2 text-[10px] uppercase tracking-[0.22em]"
          style={{ color: mood.textMuted }}
        >
          Section trim
        </p>
        <div
          className={`h-[10px] w-full rounded-full ${mood.woodClass}`}
          style={{ backgroundSize: "160px 10px, auto, auto, auto" }}
          aria-hidden
        />
        <div
          className="mt-2 h-px w-full"
          style={{ background: `${mood.accentSolid}66` }}
          aria-hidden
        />
      </div>
    </section>
  );
}
