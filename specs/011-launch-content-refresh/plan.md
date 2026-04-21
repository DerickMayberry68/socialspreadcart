# Implementation Plan: Launch Content Refresh

**Branch**: `011-launch-content-refresh` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)

## Summary

Ship a coordinated content and copy refresh for the Home page, Menu page,
and Booking page (currently `/contact`) ahead of the first production
launch of The Social Spread. Copy changes are sourced verbatim from the
client brief. Small structural additions are introduced where the brief
requires them: a new "Effortless for you. Unforgettable for them."
callout on the home page, five per-category editorial blocks on the menu
page, and a "How It Works" + pricing-minimum + closing callout on the
booking page.

This feature does not introduce new persisted data, API routes, or
services. It is a content and component-layout change with a small risk
surface primarily in visual regression.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5 (App Router), React 19, Tailwind
CSS 3.4, existing shared components (`SectionShell`, `SectionHeading`,
`Reveal`, `Card`, `Badge`, `Button`, `QuoteForm`, `MenuBrowser`,
`TestimonialCarousel`).
**Storage**: None. No schema changes, no migrations.
**Testing**: Visual review against the client brief; existing unit
tests for `QuoteForm` and `MenuBrowser` must continue to pass; manual
check that routes `/`, `/menu`, and `/contact` render without runtime
errors.
**Target Platform**: Next.js full-stack app on Vercel. Changes are
server-rendered React with no runtime or environment impact.
**Constraints**:
- No new data model or API work
- No regression of existing dynamic menu browser or quote form
- Consistent voice across all three pages (partial rollout is worse
  than no rollout)
- Copy stays hardcoded in React components for now; tenant-aware
  content is out of scope (spec 005 territory)
**Scale/Scope**: Three page files plus their section components, one
shared site config change (nav label), and minor new copy constants in
`fallback-data.ts` or co-located inside the page components.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | Each page's changes live in that page's own file; shared constants stay in `lib/site.ts` / `fallback-data.ts` | Pass |
| II. Open/Closed | New sections extend existing page layouts without breaking existing sections or data flows | Pass |
| III. Liskov / DRY | Repeated CTA label ("Book The Social Spread") lives in one site-config constant or a small shared component | Pass |
| IV. Interface Segregation | No new cross-component APIs introduced | Pass |
| V. Dependency Inversion | Still reads menu data from `getMenuItems()`; editorial copy is a static constant module | Pass |
| UX & Brand | Voice refresh is the entire point; executed per client brief | Pass |
| Tech Stack | No stack changes; pure content/component work | Pass |

## Project Structure

```text
specs/
└── 011-launch-content-refresh/
    ├── spec.md
    ├── plan.md
    └── tasks.md

expected implementation surface:

src/
├── app/
│   └── (site)/
│       ├── page.tsx                         # home page entry
│       ├── menu/page.tsx                    # menu page entry
│       └── contact/page.tsx                 # booking page entry
├── components/
│   └── sections/
│       ├── home-page.tsx                    # main home content sections
│       └── (optional) booking-how-it-works.tsx   # new, per need
└── lib/
    ├── site.ts                              # nav label + unified CTA label
    └── fallback-data.ts                     # optional: launch content constants
                                             # (services list, menu categories,
                                             # how-it-works steps)
```

## Design Direction

1. **Treat copy as data.** Move user-visible copy blocks (services list,
   menu category editorial entries, how-it-works steps, pricing note,
   closing callouts) into typed arrays / records co-located per page or
   centralized in `src/lib/fallback-data.ts` (or a new
   `src/lib/launch-content.ts` if it keeps the existing fallback file
   clean). This makes client copy revisions a one-file change and keeps
   JSX readable.
2. **Preserve dynamic surfaces.** The menu page keeps `getMenuItems()`
   and `MenuBrowser`. The booking page keeps `QuoteForm`. The
   editorial additions wrap around these, they do not replace them.
3. **Unify the booking CTA.** Centralize the booking CTA label and
   target in `src/lib/site.ts` (e.g., `bookingCta: { label, href }`)
   so hero, bottom CTA, and sticky nav all read from one place.
4. **One-way rename.** Nav label changes from "Contact" to the agreed
   booking label but the route remains `/contact`. No redirects needed.
5. **Incremental rollout path.** Although the stories are P1, the
   tasks are grouped by page so each page can land in its own small
   PR. All three should ship before launch day (see SC-004 in spec).
6. **Accessibility**: headings must use semantic order (`h1` per page,
   `h2` for section titles, etc.). The "How It Works" section uses an
   ordered list (`<ol>`) so numbering is real, not cosmetic.
7. **No new photography.** Re-use existing assets referenced in
   `src/lib/media.ts`.

## Implementation Order

1. **Clarifications.** Resolve the six open clarifications in `spec.md`
   with the client. Required before touching copy that depends on them
   (CTA label, nav label, route, energy drinks inclusion).
2. **Shared plumbing.**
   - Unify booking CTA label / target in `src/lib/site.ts`.
   - Update the nav label in `src/lib/site.ts`.
   - Add a typed launch-content module (or extend
     `fallback-data.ts`) with services list, menu category editorial
     entries, and how-it-works steps.
3. **Home page copy refresh** (US1).
   - Update hero headline, sub-line, subtext, CTA label.
   - Replace about/experience section copy.
   - Replace cart service section copy.
   - Insert services list section.
   - Insert new "Effortless for you. Unforgettable for them." callout.
   - Update bottom CTA heading + button label.
4. **Menu page editorial expansion** (US2).
   - Add intro block ("The Social Spread Menu" + tagline).
   - Add five editorial category blocks in order.
   - Preserve the `MenuBrowser` rendering below.
   - Add closing line.
5. **Booking page restructure** (US3).
   - Rename header to "Reserve The Social Spread."
   - Add opening statement.
   - Add "How It Works" ordered 4-step section.
   - Add pricing minimum callout ($250).
   - Add closing callout.
   - Keep `QuoteForm` intact.
6. **Cross-page consistency pass** (US4).
   - Walk the site locally and ensure no legacy copy remains.
   - Ensure all primary CTAs route to `/contact` and use the unified
     label.
7. **Client review in staging.**
   - Ship to Vercel preview, send Shayley the preview URLs, apply any
     final tweaks before production launch.

## Risks & Mitigations

- **Visual regression from longer hero subtext.** Mitigation: check the
  hero on mobile and desktop breakpoints; trim if layout breaks.
- **Energy drinks on services list without active fulfillment.**
  Mitigation: confirm with client before publishing; remove from list
  if not yet a live offering.
- **Menu editorial sections competing with the menu browser for
  attention.** Mitigation: use `SectionHeading` + consistent spacing so
  the editorial blocks feel like context, not duplicate menu content.
- **CTA label drift.** Mitigation: centralize label in `site.ts`.
- **Tenant-agnostic copy in a multi-tenant codebase.** Mitigation:
  acknowledge in spec that this is platform-level copy today and that
  tenant-aware content is future work; do not silently couple new copy
  to tenant resolution logic.

## Out Of Scope

- Making copy tenant-configurable from an admin UI (future spec 005).
- New photography or new menu item data (data-driven pickup items are
  unchanged).
- Email template updates (quote confirmation emails are not in this
  brief).
- Any backend, API, or database change.
- Route rename from `/contact` to `/book` (deferred; revisit after
  launch).

## Open Questions For Later Clarification

These mirror the spec's open clarifications. Answers must exist before
the dependent tasks begin:

1. Unified booking CTA label ("Book the Cart" vs "Book The Social
   Spread" vs both).
2. Navigation label for the booking route ("Contact" vs "Book" vs
   "Reserve").
3. Whether to keep `/contact` as the booking route or rename.
4. Whether to trim the hero subtext for layout balance.
5. Whether energy drinks are an active offering to list publicly.
6. Services list placement (standalone section vs nested in cart
   service section).
