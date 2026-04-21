---
description: "Task list for launch content refresh (home, menu, booking)"
---

# Tasks: Launch Content Refresh

**Input**: Design documents from `specs/011-launch-content-refresh/`
**Prerequisites**: `spec.md` complete, `plan.md` complete, open clarifications resolved with the client before starting tasks that depend on them

**Tests**: No new automated tests required. Existing unit tests for `QuoteForm` and `MenuBrowser` must continue to pass. All acceptance is visual review against the client brief plus manual walk-through in a Vercel preview.

**Organization**: Grouped by page so each group can ship as its own small PR. Phase 0 (clarifications) and Phase 1 (shared plumbing) are prerequisites for the page-specific phases. Phase 5 is the coordinated consistency pass and client review.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel with other tasks that do not touch the same files.

---

## Phase 0: Clarifications (Blocker)

**Purpose**: Resolve ambiguity in the client brief before any code is written.

- [ ] T001 Decide the unified booking CTA label. Options: "Book The Social Spread" (recommended, since nav is already "Book"), "Book the Cart", or both used intentionally. Record decision in `spec.md` open clarifications.
- [x] T002 Decide the site-nav label for the booking route. **Resolved: "Book".**
- [ ] T003 Confirm the booking route stays at `/contact` (recommended) vs renames to `/book` with a redirect. Record decision.
- [x] T004 Confirm whether "energy drinks" belongs on the public services list. **Resolved: yes, energy drinks are an active offering and will be listed.**
- [ ] T005 Confirm hero subtext length is acceptable at the current layout scale (desktop + mobile) or whether to trim for balance. May be deferred to implementation-time preview review.
- [x] T006 Confirm services list placement. **Resolved: nested inside the cart service section on the home page.**

**Checkpoint**: T001, T003, and T005 still pending. T005 can be resolved during implementation via preview screenshots. T001 and T003 should be confirmed before Phase 2 (home page) and Phase 4 (booking page) respectively.

---

## Phase 1: Shared Plumbing

**Purpose**: Centralize values used across multiple pages so copy revisions stay DRY.

- [ ] T007 In `src/lib/site.ts`, update the navigation entry for `/contact` so the label reflects the decision from T002. Preserve the `href: "/contact"` path per T003.
- [ ] T008 In `src/lib/site.ts`, add a typed `bookingCta` constant (e.g., `{ label: string; href: "/contact" }`) using the label from T001. Export it.
- [ ] T009 [P] Create `src/lib/launch-content.ts` (or extend `src/lib/fallback-data.ts` if preferred) with typed constants for: home services list, menu category editorial entries, and booking "how it works" steps. Populate with the exact copy from the client brief. Do not inline the strings later in JSX.

**Checkpoint**: Shared constants exist and compile. Phases 2-4 can consume them.

---

## Phase 2: Home Page Refresh (User Story 1)

**Purpose**: Replace the legacy home page copy with the elevated voice and add the new small callout.

All tasks here edit `src/components/sections/home-page.tsx` unless noted.

- [ ] T010 Replace hero headline with "An elevated approach to hosting, designed to be experienced." and add the sub-line "Snacks & sips, served your way." Replace the hero subtext with the brief's subtext ("The Social Spread is a luxury mobile cart bringing curated bites and signature sips directly to your event so you can host effortlessly and leave a lasting impression.").
- [ ] T011 Replace hero primary CTA label and target with the unified `bookingCta` from T008. Confirm the secondary button ("Browse the Menu") remains.
- [ ] T012 Replace the existing "pillars" / about content with the new About/Experience section. Headline: "Not just catering - an experience your guests talk about." Body: two paragraphs from the brief.
- [ ] T013 Replace or rework the cart service section. Headline: "A mobile cart that IS the moment, not just the menu." Body paragraph from the brief. Per T006, the services list (T014) lives nested inside this section, so structure the section to accommodate both the body copy and the services list below it.
- [ ] T014 Inside the cart service section (per T006), render the five offerings from the brief: Curated charcuterie cups & boxes; Signature dirty sodas + energy drinks (confirmed per T004); Fresh-made mini pancakes; Bartending service; Interactive ice cream toppings bar. Follow with the closing line "Each service is designed to be customizable, visually stunning, and easy for your guests to enjoy." Source list from T009.
- [ ] T015 Insert the new small callout section between Services and the bottom CTA. Title: "Effortless for you. Unforgettable for them." Body: the single supporting sentence from the brief.
- [ ] T016 Update the bottom CTA. Heading: "Let's make your event the one everyone remembers." Primary button uses the unified `bookingCta`.
- [ ] T017 Remove or archive legacy copy constants from home-page.tsx that are no longer rendered (e.g., `bookingSteps` if superseded, unused `proofStats` text if the section is dropped). Only remove if the corresponding section is actually removed.
- [ ] T018 Run the dev server and visually verify each home-page section renders the new copy with no layout regressions at mobile and desktop widths.

**Checkpoint**: US1 passes its acceptance scenarios end-to-end.

---

## Phase 3: Menu Page Editorial Expansion (User Story 2)

**Purpose**: Introduce editorial category framing while preserving the existing pickup menu browser.

- [ ] T019 Edit `src/app/(site)/menu/page.tsx` to replace the top `SectionHeading` with a new intro: title "The Social Spread Menu", tagline "A thoughtfully curated selection of bites and sips designed to be as beautiful as they are memorable."
- [ ] T020 Below the intro, render five editorial category blocks in the brief's order (Charcuterie, Dirty Sodas, Mini Pancake Bar, Bartending Service, Ice Cream Toppings Bar). Each block is a heading + tagline + descriptive paragraph. Source copy from the T009 constants. Use `SectionShell` / `Card` / existing design tokens for visual consistency.
- [ ] T021 In the Dirty Sodas editorial block, include the sentence "Feel free to have us add your brand or logo to the cups!" as written in the brief.
- [ ] T022 Keep the existing Pickup info cards (`PackageCheck`, `Truck`, `Clock3`) if they remain useful; otherwise demote them below the editorial sections. Do not delete the `MenuBrowser` call; it must still render with `getMenuItems()` data.
- [ ] T023 After the `MenuBrowser` renders, add a closing line at the bottom of the page: "Every detail is intentionally selected and styled to create an experience that feels effortless, inviting, and distinctly yours."
- [ ] T024 Verify the menu page renders correctly against real or fallback menu data (`getMenuItems()` result). Confirm no regression in the pickup items table / grid.

**Checkpoint**: US2 passes its acceptance scenarios end-to-end.

---

## Phase 4: Booking Page Restructure (User Story 3)

**Purpose**: Reframe `/contact` as the reservation experience and add structural elements requested in the brief.

All tasks here edit `src/app/(site)/contact/page.tsx` unless noted.

- [ ] T025 Replace the page header. `SectionHeading` title becomes "Reserve The Social Spread"; drop the prior "Contact and Quotes" eyebrow. Supporting description becomes the opening statement from the brief ("An elevated experience designed with intention, booked with ease." + the supporting paragraph).
- [ ] T026 Add a "How It Works" section with a semantic ordered list (`<ol>`) rendering four steps: (1) Submit Your Inquiry; (2) Proposal & Customization; (3) Secure Your Date; (4) We Handle the Details. Each step shows its title plus description from the brief. Source steps from the T009 constants.
- [ ] T027 Add a pricing-note section below "How It Works". Primary line: "Each event is custom quoted based on guest count, services, and styling." Emphasized secondary line: "Our minimum investment begins at $250." Use visual emphasis (card, accent color, larger type) so the $250 minimum reads as an explicit floor, not a full-package price.
- [ ] T028 Add a closing callout above or below the `QuoteForm`: "Designed for gatherings that deserve a little more attention to detail." Treat as a small card/band, not a standalone hero.
- [ ] T029 Confirm the `QuoteForm` still renders with no functional regression. The existing `Card`s with Location / Phone / Email / "What to expect" may stay but should be re-ordered so the page reads: header → opening statement → how it works → pricing note → closing callout → quote form (with contact cards beside or below).
- [ ] T030 Audit any remaining hero/subheading text on the page that still uses the prior contact-form tone and align it with the elevated voice.

**Checkpoint**: US3 passes its acceptance scenarios end-to-end.

---

## Phase 5: Coordinated Consistency & Client Review (User Story 4)

**Purpose**: Prove the refresh reads as one coherent voice across all three pages before launch.

- [ ] T031 Walk the site locally (dev server) through the flow Home → Menu → Booking. Confirm no legacy headline, subhead, CTA label, or body paragraph from the prior voice remains visible on any of the three pages.
- [ ] T032 Confirm every primary booking CTA across Home (hero + bottom), Menu, Booking, and any header/sticky nav uses the unified `bookingCta.label` and routes to `/contact`.
- [ ] T033 Run `npm run lint` and `npm run build`. Fix any issues introduced by the content changes (unused imports from removed sections, broken typings on new constants).
- [ ] T034 Deploy to a Vercel preview. Share the preview URL with Shayley. Collect sign-off on each page against the acceptance scenarios and the client brief.
- [ ] T035 Apply any final client-requested tweaks. Re-request sign-off if a page's copy materially changes.

**Checkpoint**: Client approves all three pages. Launch readiness unblocked.

---

## Notes

- This feature is copy + component-layout only. No API, DB, auth, or tenancy changes.
- Copy is intentionally hardcoded per current codebase conventions. Making it tenant-editable is deferred to the brand-configuration feature (spec 005).
- The booking route stays at `/contact` unless T003 is resolved otherwise; nav label may change even if the route does not.
- The menu browser (`getMenuItems()`) and quote form (`QuoteForm`) are not modified by this feature beyond their surrounding framing.
- If the client later supplies photography specifically for the new editorial menu sections or the booking "How It Works" steps, a small follow-up task (not in this list) can slot new assets into the existing structure without copy changes.
