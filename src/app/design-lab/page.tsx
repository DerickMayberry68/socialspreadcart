import type { Metadata } from "next";

import { MoodPanel, type Mood } from "@/components/design-lab/mood-panel";

export const metadata: Metadata = {
  title: "Design lab | SocialSpreadCart",
  robots: { index: false, follow: false },
};

const moods: Mood[] = [
  {
    id: "whitewashed",
    title: "Whitewashed reclaimed",
    tagline:
      "Light, airy farmhouse energy. Keeps the cream DNA and adds driftwood grays, soft sage, and a warm brass accent.",
    woodClass: "wood-whitewashed",
    pageBg:
      "linear-gradient(180deg, #fdf8ef 0%, #f5ecdb 100%)",
    surface: "#fbf3e5",
    cardSurface: "#fffaf0",
    textPrimary: "#2c2a24",
    textMuted: "rgba(44, 42, 36, 0.62)",
    eyebrow: "#8a7246",
    accentSolid: "#b69152",
    accentSoft: "#e9dcc0",
    accentContrast: "#7a5a2a",
    buttonBg: "#5b733c",
    buttonText: "#f8f1e3",
    buttonGhostBorder: "rgba(91, 115, 60, 0.35)",
    buttonGhostText: "#3c4a27",
    shadow: "0 20px 50px rgba(90, 78, 50, 0.12)",
    swatches: [
      { name: "Linen", hex: "#fbf3e5", role: "page" },
      { name: "Cream", hex: "#f8f1e3", role: "surface" },
      { name: "Oat", hex: "#ede2ce", role: "plank" },
      { name: "Soft sage", hex: "#8ea66f", role: "accent" },
      { name: "Brass", hex: "#b69152", role: "accent" },
      { name: "Driftwood", hex: "#a8a08e", role: "neutral" },
    ],
    pathwayAccent:
      "linear-gradient(135deg, #f5e7d4 0%, #fff7ef 100%)",
    heroTexture: "trim",
  },
  {
    id: "walnut",
    title: "Weathered warm walnut",
    tagline:
      "Cozy supper-club mood. Deeper cream, walnut-wood surfaces, ember terracotta pop, and richer shadows.",
    woodClass: "wood-walnut",
    pageBg: "linear-gradient(180deg, #f3e6d0 0%, #e8d6b8 100%)",
    surface: "#efe0c4",
    cardSurface: "#fcf3e0",
    textPrimary: "#2a1e12",
    textMuted: "rgba(42, 30, 18, 0.62)",
    eyebrow: "#8a4a25",
    accentSolid: "#b8562e",
    accentSoft: "#f0ccb4",
    accentContrast: "#7a3416",
    buttonBg: "#4a2f1d",
    buttonText: "#fdf1d9",
    buttonGhostBorder: "rgba(74, 47, 29, 0.35)",
    buttonGhostText: "#4a2f1d",
    shadow: "0 26px 60px rgba(56, 32, 16, 0.2)",
    swatches: [
      { name: "Deep cream", hex: "#f3e6d0", role: "page" },
      { name: "Butter", hex: "#fcf3e0", role: "surface" },
      { name: "Walnut", hex: "#4a2f1d", role: "wood" },
      { name: "Cognac", hex: "#8c5a36", role: "accent" },
      { name: "Ember", hex: "#b8562e", role: "pop" },
      { name: "Moss", hex: "#5b733c", role: "retained" },
    ],
    pathwayAccent:
      "linear-gradient(135deg, #f2c7a5 0%, #fff1e2 100%)",
    heroTexture: "panel",
  },
  {
    id: "rustic-mix",
    title: "Rustic modern mix",
    tagline:
      "Best of both. Pale linen canvas with bolder walnut accents on hero and dividers, plus terracotta + brass pops.",
    woodClass: "wood-walnut",
    pageBg: "linear-gradient(180deg, #fbf5e8 0%, #f1e7d2 100%)",
    surface: "#fbf3e1",
    cardSurface: "#ffffff",
    textPrimary: "#231a11",
    textMuted: "rgba(35, 26, 17, 0.64)",
    eyebrow: "#9a6a3a",
    accentSolid: "#a84a2b",
    accentSoft: "#f2d2bd",
    accentContrast: "#7d2f16",
    buttonBg: "#3a2516",
    buttonText: "#fdf1d9",
    buttonGhostBorder: "rgba(168, 74, 43, 0.4)",
    buttonGhostText: "#7d2f16",
    shadow: "0 22px 56px rgba(64, 40, 22, 0.16)",
    swatches: [
      { name: "Linen", hex: "#fbf5e8", role: "page" },
      { name: "White card", hex: "#ffffff", role: "surface" },
      { name: "Walnut trim", hex: "#4a2f1d", role: "accent" },
      { name: "Terracotta", hex: "#a84a2b", role: "pop" },
      { name: "Brass", hex: "#b69152", role: "accent" },
      { name: "Sage", hex: "#5b733c", role: "retained" },
    ],
    pathwayAccent:
      "linear-gradient(135deg, #efd1b3 0%, #fff7ec 100%)",
    heroTexture: "panel",
  },
];

export default function DesignLabPage() {
  return (
    <main className="min-h-screen bg-[#f3ecdd] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[#8a4a25]">
            Design lab
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-[#2a1e12]">
            Barn-wood mood preview
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#2a1e12]/70">
            Three directions for warming up the site. Each panel shows the
            proposed palette, a sample hero, a pathway card, a quote form,
            and the new section trim so you can see the mood in context.
            Nothing in the live site has changed yet. Pick a direction and
            we&apos;ll roll it into the home page and global chrome.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#2a1e12]/50">
            This page is noindex and not linked from navigation.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-3">
          {moods.map((mood) => (
            <MoodPanel key={mood.id} mood={mood} />
          ))}
        </div>

        <div className="mt-12 grid gap-6 rounded-[28px] border border-[#4a2f1d]/15 bg-[#fffaf0] p-6 xl:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a4a25]">
              Wood textures, close up
            </p>
            <p className="mt-2 text-sm text-[#2a1e12]/70">
              The same three utilities applied to full panels so you can
              judge grain density and contrast on larger surfaces.
            </p>
          </div>
          <div className="wood-whitewashed h-40 rounded-[20px] border border-[#b69152]/20" />
          <div className="wood-walnut h-40 rounded-[20px] border border-black/10" />
          <div className="xl:col-span-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="wood-driftwood h-40 rounded-[20px] border border-black/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
