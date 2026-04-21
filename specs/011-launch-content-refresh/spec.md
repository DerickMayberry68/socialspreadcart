# Feature Specification: Launch Content Refresh

**Feature Branch**: `011-launch-content-refresh`
**Created**: 2026-04-20
**Status**: Draft
**Input**: Client (Shayley) brief delivering launch-ready copy and structural
updates for the Home page, Menu page, and Booking page ahead of the first
production launch of The Social Spread.

## Context

The Social Spread Cart is preparing for its first production launch as a
SocialSpreadCart tenant. The client provided a comprehensive copy and
content brief covering three public-facing pages. The brief includes:

- Replacement copy for existing sections (hero, about, cart service,
  services list, bottom CTA) on the Home page.
- A new editorial structure on the Menu page that introduces per-category
  descriptions (Charcuterie, Dirty Sodas, Mini Pancake Bar, Bartending
  Service, Ice Cream Toppings Bar) plus an intro and closing line above or
  around the existing dynamic menu browser.
- A restructured Booking page (currently `/contact`) with a new header,
  opening statement, a numbered 4-step "How It Works" section, a pricing
  minimum note ($250), and a closing callout — repositioning the page from
  "Contact" to "Reserve The Social Spread."

This is a coordinated voice refresh, not a rewrite of the product. Shipping
the new voice on one page while leaving the old voice on another produces a
worse experience than shipping all three together. At the same time, each
page is independently buildable and verifiable, so tasks will be grouped
per page so they can be merged in sequence or bundled.

The copy lives in React components today (hardcoded in page and section
files). Making this copy tenant-configurable through a CMS or brand config
layer is out of scope for this feature and is covered by future work
(spec 005 brand configuration).

## User Scenarios & Testing

### User Story 1 - Home Page Reflects Elevated Brand Voice (Priority: P1)

A visitor lands on the home page and sees copy that frames The Social
Spread as a luxury mobile cart experience rather than a generic catering
service. The hero, about/experience section, cart service block, services
list, new "Effortless for you. Unforgettable for them." callout, and
bottom CTA all reflect the new voice.

**Why this priority**: The home page is the primary entry point for the
launch. The new voice ("An elevated approach to hosting, designed to be
experienced") is the foundation of the brand pitch; without it the first
impression is stale.

**Independent Test**: Load `/` and verify each section listed in the
client brief renders the exact new copy, buttons link to the booking
page, and the new "Effortless for you. Unforgettable for them." callout
is present between the services list and the bottom CTA.

**Acceptance Scenarios**:

1. **Given** a visitor loads the home page, **When** the hero renders,
   **Then** the headline reads "An elevated approach to hosting, designed
   to be experienced." with the sub-line "Snacks & sips, served your way."
   and the subtext matches the brief.
2. **Given** a visitor scrolls past the hero, **When** they reach the
   about/experience section, **Then** it reads "Not just catering - an
   experience your guests talk about." with the supporting two paragraphs
   from the brief.
3. **Given** a visitor reaches the cart service section, **When** it
   renders, **Then** it reads "A mobile cart that IS the moment, not just
   the menu." with the supporting body copy.
4. **Given** a visitor reaches the services list, **When** it renders,
   **Then** the five offerings appear as described (charcuterie cups &
   boxes, signature dirty sodas + energy drinks, fresh-made mini pancakes,
   bartending service, interactive ice cream toppings bar) with the
   closing line about customization.
5. **Given** a visitor reaches the new small callout section, **When** it
   renders, **Then** it reads "Effortless for you. Unforgettable for
   them." with the supporting sentence.
6. **Given** a visitor reaches the bottom CTA, **When** it renders,
   **Then** the heading reads "Let's make your event the one everyone
   remembers." and the button label reads "Book The Social Spread."
7. **Given** a visitor clicks any primary CTA button, **When** the click
   fires, **Then** they are navigated to the Booking page (currently
   `/contact`).

---

### User Story 2 - Menu Page Reads As An Editorial Menu (Priority: P1)

A visitor opens the menu page and sees the new editorial intro, then a
section for each service category with a short tagline and descriptive
paragraph, followed by the existing menu browser (pickup items) and a
closing line. The menu feels curated and on-brand rather than purely
transactional.

**Why this priority**: The menu page is a primary conversion surface.
The client specifically called out that the menu "is designed to be as
beautiful as they are memorable" and each category needs a narrative.

**Independent Test**: Load `/menu` and verify the new intro ("The Social
Spread Menu" + tagline), the five category editorial blocks in the
listed order, the existing pickup menu browser, and the closing line all
render in sequence.

**Acceptance Scenarios**:

1. **Given** a visitor opens the menu page, **When** it loads, **Then** a
   top intro section renders with the title "The Social Spread Menu" and
   the tagline "A thoughtfully curated selection of bites and sips
   designed to be as beautiful as they are memorable."
2. **Given** the intro has rendered, **When** the page continues, **Then**
   five editorial category sections appear in this order: Charcuterie,
   Dirty Sodas, Mini Pancake Bar, Bartending Service, Ice Cream Toppings
   Bar, each with the exact tagline and paragraph copy from the brief.
3. **Given** the editorial sections have rendered, **When** the page
   continues, **Then** the existing pickup menu browser remains
   functional with its current data-backed items.
4. **Given** all sections have rendered, **When** the visitor reaches the
   bottom, **Then** the closing line "Every detail is intentionally
   selected and styled to create an experience that feels effortless,
   inviting, and distinctly yours." appears.
5. **Given** the Dirty Sodas copy references custom branding, **When** it
   renders, **Then** the sentence "Feel free to have us add your brand or
   logo to the cups!" is included.

---

### User Story 3 - Booking Page Frames The Reservation Process (Priority: P1)

A visitor opens the booking page and sees a new header ("Reserve The
Social Spread"), an opening statement that sets expectations, a 4-step
"How It Works" flow, a clear pricing note ($250 minimum), and a closing
callout, all above or around the existing quote form. The page feels
like a concierge booking experience rather than a generic contact form.

**Why this priority**: This is the primary conversion page. Clear
expectations (process, pricing minimum) are what move an interested
visitor to submit an inquiry.

**Independent Test**: Load `/contact` (the booking route) and verify the
new header, opening statement, 4 numbered steps, pricing note including
the $250 minimum, closing callout, and the existing quote form all
render in the correct sequence.

**Acceptance Scenarios**:

1. **Given** a visitor opens the booking page, **When** it loads,
   **Then** the page header reads "Reserve The Social Spread."
2. **Given** the header has rendered, **When** the opening statement
   renders, **Then** it matches the brief: "An elevated experience
   designed with intention, booked with ease." plus the supporting
   paragraph about limited bookings and process.
3. **Given** the opening statement has rendered, **When** the "How It
   Works" section renders, **Then** it shows four numbered steps with the
   exact titles and descriptions from the brief: (1) Submit Your Inquiry,
   (2) Proposal & Customization, (3) Secure Your Date, (4) We Handle the
   Details.
4. **Given** the steps have rendered, **When** the pricing note renders,
   **Then** it states "Each event is custom quoted based on guest count,
   services, and styling." and clearly displays "Our minimum investment
   begins at $250."
5. **Given** the pricing note has rendered, **When** the closing callout
   renders, **Then** it reads "Designed for gatherings that deserve a
   little more attention to detail."
6. **Given** the page has rendered, **When** the visitor scrolls to or
   lands on the quote form, **Then** the existing quote form remains
   functional without regression.
7. **Given** the site navigation is visible, **When** the visitor looks
   at the nav, **Then** the label for the booking route has been updated
   to reflect a booking feel (e.g., "Book" or "Reserve") rather than the
   prior "Contact" label, unless the open clarification decides
   otherwise.

---

### User Story 4 - Launch Voice Is Consistent Across All Three Pages (Priority: P2)

A visitor moves between Home, Menu, and Booking and experiences one
coherent voice — elevated, intentional, hospitality-forward — without
any page still using the prior playful-cart voice.

**Why this priority**: Voice inconsistency makes a premium brand feel
unfinished. This story ensures the three page-level stories are shipped
as a coherent release rather than a drip of mismatched updates.

**Independent Test**: Walk through Home → Menu → Booking and confirm no
section still uses the prior hero/about/cart copy, the prior menu intro,
or the prior contact header.

**Acceptance Scenarios**:

1. **Given** all three page updates have shipped, **When** a visitor
   walks the flow Home → Menu → Booking, **Then** no legacy headline,
   sub-headline, or CTA copy from the prior voice remains visible.
2. **Given** the site navigation is visible, **When** a visitor uses it
   across the three pages, **Then** the nav labels and button labels are
   consistent with the new voice (no mix of "Start Your Order" /
   "Contact" / "Book the Cart").

## Edge Cases

- **Legacy route still linked**: if any off-page marketing or email
  still links to the old route labels ("Contact"), the booking route
  MUST continue to respond at `/contact` even if the nav label changes.
- **Dietary / lead-time metadata**: the new menu editorial sections are
  narrative; they MUST NOT remove the existing per-item pickup data
  (price, lead time, dietary) that the menu browser still needs.
- **"Book The Social Spread" button**: this label appears in multiple
  places (hero, bottom CTA, possibly the sticky nav). All instances MUST
  use the same label and target.
- **Pricing minimum clarity**: the $250 minimum is a floor, not a quote.
  Copy MUST make clear this is a minimum investment, not a package
  price.
- **Brand editability**: this spec intentionally hardcodes copy in React
  components, consistent with the current codebase. Making this copy
  tenant-configurable is out of scope and belongs to the brand
  configuration spec.
- **Tenant isolation**: this copy is specifically for The Social Spread
  tenant; it MUST NOT be written in a way that globally changes copy for
  other future tenants that might share the same React components.
  Implementation should follow existing patterns (hardcoded in
  components), which means this content is effectively platform-level
  until a tenant-aware content layer exists.

## Requirements

### Functional Requirements

- **FR-001**: The home page hero section MUST render the new headline
  ("An elevated approach to hosting, designed to be experienced.") and
  sub-line ("Snacks & sips, served your way.") and subtext from the
  client brief verbatim.
- **FR-002**: The home page hero CTA button label MUST read "Book the
  Cart" (or the unified label chosen in the open clarifications), and
  MUST route to the booking page.
- **FR-003**: The home page MUST contain an About/Experience section
  with the headline "Not just catering - an experience your guests talk
  about." and the two supporting paragraphs from the brief.
- **FR-004**: The home page MUST contain a Cart Service section with the
  headline "A mobile cart that IS the moment, not just the menu." and
  the supporting body.
- **FR-005**: The home page MUST present the five services (charcuterie
  cups & boxes; signature dirty sodas + energy drinks; fresh-made mini
  pancakes; bartending service; interactive ice cream toppings bar) with
  the closing "customizable, visually stunning, and easy" line.
- **FR-006**: The home page MUST include a new small callout section
  titled "Effortless for you. Unforgettable for them." with the
  supporting sentence from the brief.
- **FR-007**: The home page bottom CTA MUST display the heading "Let's
  make your event the one everyone remembers." with the button label
  "Book The Social Spread."
- **FR-008**: The menu page MUST render a top intro with the title "The
  Social Spread Menu" and the tagline from the brief.
- **FR-009**: The menu page MUST render five editorial category sections
  in this order: Charcuterie, Dirty Sodas, Mini Pancake Bar, Bartending
  Service, Ice Cream Toppings Bar; each with the exact tagline and body
  copy from the brief.
- **FR-010**: The menu page MUST continue to render the existing dynamic
  pickup menu (menu browser) using current data-fetching and per-item
  fields without regression.
- **FR-011**: The menu page MUST render the closing line ("Every detail
  is intentionally selected and styled...") after the last editorial
  section.
- **FR-012**: The booking page MUST render the header "Reserve The
  Social Spread" in place of the prior "Contact and Quotes" header.
- **FR-013**: The booking page MUST render the opening statement ("An
  elevated experience designed with intention, booked with ease.") and
  the supporting paragraph from the brief.
- **FR-014**: The booking page MUST render a "How It Works" section with
  four numbered steps titled exactly: (1) Submit Your Inquiry, (2)
  Proposal & Customization, (3) Secure Your Date, (4) We Handle the
  Details; each with the description from the brief.
- **FR-015**: The booking page MUST render a pricing note stating "Each
  event is custom quoted based on guest count, services, and styling."
  AND stating "Our minimum investment begins at $250" with visual
  emphasis so it reads as a stated minimum.
- **FR-016**: The booking page MUST render the closing small-section
  callout ("Designed for gatherings that deserve a little more attention
  to detail.").
- **FR-017**: The booking page MUST continue to render the existing
  quote form with no functional regression.
- **FR-018**: The booking route MUST remain reachable at `/contact` (its
  current path) regardless of any nav label change.
- **FR-019**: All primary CTA buttons across Home, Menu, and Booking MUST
  use a single consistent label for the booking action (decided in
  clarification) and MUST route to the booking page.

### Key Entities

This feature does not introduce new persisted entities. It defines
content rendered by existing React components. The only candidate
entity if later made configurable would be a tenant-scoped "content /
copy block" model — explicitly out of scope here.

## Success Criteria

- **SC-001**: A reviewer checking the home page finds every headline,
  subhead, body paragraph, services list item, new callout, and CTA
  label matching the client brief word-for-word.
- **SC-002**: A reviewer checking the menu page finds the intro, all
  five editorial category sections in the listed order, the existing
  menu browser, and the closing line all present and on-brand.
- **SC-003**: A reviewer checking the booking page finds the new header,
  opening statement, four how-it-works steps, the pricing minimum, the
  closing callout, and the still-working quote form.
- **SC-004**: No section on any of the three updated pages still uses
  the prior voice ("A happier way to host snacks, sips, and standout
  moments.", "Start Your Order", "Contact and Quotes", etc.).
- **SC-005**: Shayley (the client) approves each page's rendered copy
  in staging before production launch.
- **SC-006**: Existing data-driven features — the menu browser, the
  quote form, the events list, the testimonials carousel — continue to
  work with no functional regression.

## Open Clarifications

### Resolved (2026-04-20)

- **Navigation label for booking route**: Nav label changes from
  "Contact" to **"Book"**.
- **"Signature dirty sodas + energy drinks"**: Energy drinks **are** an
  active offering and WILL be listed on the public services list.
- **Services list placement**: The services list is **nested inside the
  cart service section** on the home page, not a standalone section.

### Still Open

1. **Unified booking CTA label**: The brief uses both "Book the Cart"
   (hero) and "Book The Social Spread" (bottom CTA). Should both pages
   use one unified label for consistency, or are the two labels
   intentional? Recommendation: unify on "Book The Social Spread" since
   the brand reference is stronger and the nav already reads "Book."
   Confirm with client.
2. **Route rename**: Should the route itself move from `/contact` to
   `/book` with a redirect, or stay at `/contact`? Recommendation: stay
   at `/contact` for now to avoid breaking any external links; revisit
   when brand configuration lands.
3. **Hero subtext length**: The brief's subtext is longer than the
   current hero subtext. Confirm that a longer hero subtext is
   acceptable for the visual layout or whether the copy should be
   trimmed for balance. (May be resolvable at implementation time based
   on preview screenshots rather than a separate decision from the
   client.)

## Assumptions

- The existing public routes `/`, `/menu`, and `/contact` remain the
  destinations for home, menu, and booking respectively.
- The existing dynamic menu browser (`MenuBrowser` with
  `getMenuItems()`) remains the source of per-item pickup data; the
  editorial category copy is additive context, not a replacement for
  the menu browser.
- The existing quote form (`QuoteForm`) on `/contact` continues to
  handle submissions; this spec changes only the surrounding framing
  and introduces the pricing note + how-it-works.
- Copy is hardcoded in React components today (consistent with current
  patterns). A tenant-aware content layer is future work and explicitly
  out of scope for this spec.
- Media assets already in `src/lib/media.ts` are sufficient for the
  refreshed sections; no new photography is required.
- The client brief is the canonical source of truth for copy; any copy
  ambiguity is resolved via the open clarifications, not by paraphrase.
