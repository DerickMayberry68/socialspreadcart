# Feature Specification: Admin-Editable Hero and Pathway Cards

**Feature Branch**: `012-admin-editable-hero-and-cards`
**Created**: 2026-04-21
**Status**: Draft
**Input**: Tenant admin (Shayley) needs to update the most visible marketing
content on the Home page — site-wide brand identity (name, tagline, primary
booking CTA), the Hero section headline/sub-line/body/CTAs, and the three
"pathway" cards that sit below the hero — from the Admin section without a
developer deploy.

## Context

Today, the home page's brand identity, hero copy, and the three pathway
cards (currently titled: "Pickup for gifting and easy hosting", "Cart
service that becomes part of the decor", "Pop-ups worth planning around")
are hardcoded in React component files (`src/components/sections/home-page.tsx`
and shared header/footer components). Every copy tweak — a reworded
headline, a different CTA label, a swapped pathway title and photo —
requires a code change, a commit, and a deploy.

This feature delivers what we are calling "Option A" of a larger admin-
editable content effort: the smallest vertical slice that hands Shayley
direct control of the highest-impact, most frequently-iterated surface
areas of her site. It introduces the first persistent, tenant-scoped
"content" data model in the app, intentionally constrained to two
content objects:

1. **Site configuration** — brand name, tagline, primary booking CTA
   label + target, and primary/secondary support contact info that the
   layout-level header and footer already render.
2. **Hero section** — headline, optional accented sub-line, body
   paragraph, and up to two CTAs (label + target).
3. **Pathway cards** (a.k.a. "image boxes") — the three home-page cards
   with title, short copy, image, badge, and link target.

Editing any of these MUST NOT require a developer, a deploy, or schema
knowledge. The Admin section already has menu-item management with image
uploads (`src/components/admin/menu-item-manager.tsx`,
`src/app/api/admin/menu-items/upload/route.ts`); this feature follows
those established patterns rather than inventing new ones.

The broader ambition (editable Menu page editorial blocks, Booking page
How-It-Works steps, Testimonials, Events, generic "content block"
system) is explicitly out of scope for this feature and will be handled
in follow-up specs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shayley Updates The Hero Without A Developer (Priority: P1)

Shayley notices that her hero headline no longer matches a marketing
campaign she's running this weekend. She signs into the Admin section,
opens the Hero editor, updates the headline, the optional sub-line, the
supporting paragraph, and the primary/secondary CTA labels, saves, and
sees the change reflected on the public home page within seconds.

**Why this priority**: The hero is the single most-viewed piece of copy
on the site and the most frequently iterated. Shipping just this slice
already removes the majority of the "please change this word" developer
asks.

**Independent Test**: As a signed-in tenant admin, open
`/admin/site-content/hero` (or the equivalent admin route), change the
headline, save, reload `/`, and verify the new headline renders in the
hero section without a deploy.

**Acceptance Scenarios**:

1. **Given** Shayley is signed in as a tenant admin, **When** she opens
   the Hero editor, **Then** the form is pre-populated with the current
   headline, sub-line, body paragraph, primary CTA label, primary CTA
   target, secondary CTA label, and secondary CTA target.
2. **Given** Shayley edits the headline and clicks Save, **When** the
   save succeeds, **Then** a confirmation is shown and the new headline
   renders on `/` on the next page load.
3. **Given** Shayley leaves the sub-line blank and saves, **When** the
   home page re-renders, **Then** the hero shows only the main headline
   (no empty sub-line slot).
4. **Given** Shayley enters an invalid CTA target (not a relative path
   starting with `/` or an absolute `https://` URL), **When** she
   attempts to save, **Then** the form blocks the save and explains
   what a valid target looks like.
5. **Given** Shayley enters a headline longer than the supported length
   limit, **When** she attempts to save, **Then** the form blocks the
   save and shows a character-count hint.
6. **Given** Shayley clears the primary CTA label, **When** she saves,
   **Then** the home page hides the primary CTA button rather than
   rendering a blank button.

---

### User Story 2 - Shayley Updates The Three Pathway Cards (Priority: P1)

Shayley wants to reshoot the pathway photo for "Cart service" and
rename "Pop-ups worth planning around" to something tied to a current
seasonal campaign. She opens the Pathway Cards editor, reorders the
three cards, edits each title/body/badge/link, uploads a new image for
card 2, and saves. The home page reflects all three cards in the new
order with the new image.

**Why this priority**: After the hero, these three cards are the next
thing every visitor sees. They are visually heavy (image + copy +
badge) and the image swap is exactly the kind of request Shayley was
previously blocked on.

**Independent Test**: As a signed-in tenant admin, open the Pathway
Cards editor, reorder the cards, upload a new image for one, change a
title, save, reload `/`, and verify (a) the new image appears, (b) the
new title renders, and (c) the cards appear in the new order.

**Acceptance Scenarios**:

1. **Given** Shayley opens the Pathway Cards editor, **When** the page
   loads, **Then** she sees exactly three card rows, each showing the
   current title, short copy, badge, link target, and image thumbnail.
2. **Given** Shayley uploads a new image for a card, **When** the
   upload completes, **Then** the card's thumbnail updates to the new
   image and the stored image URL is set without her needing to paste
   one.
3. **Given** Shayley reorders the cards, **When** she saves, **Then**
   the home page renders them in the new order.
4. **Given** Shayley leaves the badge field blank, **When** she saves,
   **Then** the card renders on the home page without a badge chip.
5. **Given** Shayley enters a link target that is neither a site-
   relative path (`/menu`) nor a valid `https://` URL, **When** she
   attempts to save, **Then** validation blocks the save with guidance.
6. **Given** Shayley attempts to add a fourth card or delete one of
   the three, **When** she initiates that action, **Then** the UI
   prevents it and explains that the home page is fixed to exactly
   three pathway cards in this release.

---

### User Story 3 - Shayley Updates Site-Wide Brand Identity (Priority: P1)

Shayley wants the header, footer, and all booking-CTA buttons to use a
new brand tagline and a new "Book" label she's A/B testing. She opens
the Site Configuration editor, updates brand name, tagline, primary
booking CTA label, primary booking CTA target, support phone, and
support email, saves, and sees the change reflected sitewide.

**Why this priority**: The booking CTA label appears in many places
(header, hero, bottom CTA, sticky nav). A single edit that updates all
of them is a huge multiplier. Brand tagline + support contact also
affect every page footer.

**Independent Test**: As a signed-in tenant admin, open the Site
Configuration editor, change the booking CTA label to a new string,
save, walk the site (home, menu, booking), and verify every primary
booking CTA renders the new label.

**Acceptance Scenarios**:

1. **Given** Shayley is signed in as a tenant admin, **When** she
   opens the Site Configuration editor, **Then** the form is pre-
   populated with the current brand name, tagline, primary booking
   CTA label, primary booking CTA target, support phone, and support
   email.
2. **Given** Shayley updates the booking CTA label and saves, **When**
   the home, menu, and booking pages re-render, **Then** every primary
   booking CTA button across those pages reflects the new label.
3. **Given** Shayley clears the support phone, **When** she saves,
   **Then** the footer omits the phone block rather than rendering a
   placeholder.
4. **Given** Shayley enters an invalid email for support contact,
   **When** she attempts to save, **Then** validation blocks the save.
5. **Given** Shayley updates the brand name, **When** she saves,
   **Then** the new brand name appears in the header wordmark and
   footer brand block.

---

### User Story 4 - Edits Are Scoped To The Current Tenant (Priority: P1)

When Shayley edits her hero, pathway cards, or site configuration, the
changes only affect her tenant (The Social Spread). No other tenant's
public site is affected, and no other tenant's admin can see or edit
Shayley's content.

**Why this priority**: The app is multi-tenant by design (specs 002–
010). Any content editing feature that ignores tenant scoping would
create a platform-wide incident the first time a second tenant joins.

**Independent Test**: As a tenant admin for tenant A, edit the hero
headline. As a tenant admin for tenant B, load tenant B's admin and
confirm tenant B's hero is unchanged, and load tenant B's public site
and confirm tenant B's hero still shows tenant B's content.

**Acceptance Scenarios**:

1. **Given** two tenants A and B exist, **When** an admin of tenant A
   updates A's hero headline, **Then** tenant B's hero headline is
   unchanged on both the admin side and the public site.
2. **Given** a signed-in admin of tenant A, **When** they attempt to
   read or write the site configuration / hero / pathway cards of
   tenant B via any admin API route, **Then** the request is rejected
   by the data-access layer.
3. **Given** a public visitor loads a tenant's domain or route,
   **When** the home page renders, **Then** the hero, pathway cards,
   and site configuration returned are exactly the content belonging
   to that tenant.

---

### User Story 5 - The Home Page Stays Up When Content Is Missing Or Broken (Priority: P2)

If the site configuration, hero, or pathway cards haven't been set up
yet for a tenant (brand-new tenant) or the content service is
temporarily unavailable, the home page still renders a safe, styled
placeholder instead of a stack trace or a blank page.

**Why this priority**: New tenants will exist (spec 009 / 010) and
will need to sign up before content is authored. The site must not
look "empty" or "broken" on day one.

**Independent Test**: Provision a brand-new tenant with no content
seeded, load that tenant's public home page, and verify the hero,
pathway cards, and site-wide header/footer still render with sensible
default copy.

**Acceptance Scenarios**:

1. **Given** a tenant has no hero content saved, **When** their home
   page renders, **Then** a default hero (with a clear "edit me in
   admin" type message in the admin, but neutral professional copy on
   the public site) renders without error.
2. **Given** a tenant has fewer than three pathway cards saved,
   **When** their home page renders, **Then** the missing cards are
   filled with neutral default cards so the three-card layout is
   preserved.
3. **Given** the content service throws an unexpected error during
   rendering, **When** the home page tries to render, **Then** the
   page falls back to the current hardcoded defaults and logs the
   error rather than 500'ing to the visitor.

---

### Edge Cases

- **Concurrent edits**: Shayley and another tenant admin save the
  hero at nearly the same moment. The system MUST accept the later
  write without silently dropping fields and MUST not corrupt the
  record; last-write-wins on the whole record is acceptable for this
  release, but the form MUST not submit stale fields it never loaded.
- **Image upload fails mid-save**: If the image upload for a pathway
  card fails but the rest of the form is valid, saving MUST either
  (a) keep the prior image and show a clear error, or (b) block the
  save entirely. It MUST NOT persist a broken/empty image URL.
- **Large headline**: Shayley pastes a 500-character headline. The
  form MUST enforce a sensible length limit before submit and give a
  live character count.
- **CTA target points offsite**: A CTA target like
  `https://partner.example.com/promo` is valid; the rendered button
  MUST open that destination. The form MUST accept both site-relative
  and absolute HTTPS targets.
- **Tenant admin without edit role**: A tenant member who is NOT an
  admin (per spec 006 roles) MUST NOT see the Site Content editors at
  all; server-side authorization MUST also block the mutations
  regardless of UI state.
- **Brand-new tenant, no content seeded**: Covered by User Story 5;
  the public home page MUST still render a professional default.
- **Cached public page**: If the public home page is cached, an edit
  from admin MUST become visible within a defined, short freshness
  window (no manual "deploy" or "clear cache" step required of the
  admin).
- **Link target becomes stale**: If a CTA points to a page that is
  later removed, the button MUST still render (with its configured
  label) rather than crash; following a stale link results in the
  site's normal 404 behavior.

## Requirements *(mandatory)*

### Functional Requirements

#### Site Configuration

- **FR-001**: A tenant admin MUST be able to view the current site
  configuration (brand name, brand tagline, primary booking CTA label,
  primary booking CTA target, support phone, support email) in the
  Admin section.
- **FR-002**: A tenant admin MUST be able to save changes to any
  subset of site-configuration fields in a single submit.
- **FR-003**: The primary booking CTA target MUST validate as either
  a site-relative path starting with `/` or an absolute `https://` URL.
- **FR-004**: The support email MUST validate as a syntactically
  valid email address when provided; it MAY be empty.
- **FR-005**: The primary booking CTA label MUST, when rendered on
  the public site, be used wherever the site currently shows a
  "booking" primary CTA (home hero, home bottom CTA, header/sticky
  nav, any section-level "book" button).
- **FR-006**: The brand name MUST drive the header wordmark and the
  footer brand block on every public page.
- **FR-007**: The brand tagline MUST drive the footer tagline on
  every public page.

#### Hero Section

- **FR-008**: A tenant admin MUST be able to view the current hero
  content (headline, optional accented sub-line, body paragraph,
  primary CTA label, primary CTA target, secondary CTA label,
  secondary CTA target) in the Admin section.
- **FR-009**: A tenant admin MUST be able to save changes to any
  subset of hero fields in a single submit.
- **FR-010**: The hero headline MUST enforce a maximum length
  appropriate for the hero layout and show a live character count.
- **FR-011**: When the hero sub-line is empty, the public home page
  MUST render the hero without a sub-line element.
- **FR-012**: When a hero CTA label is empty, the public home page
  MUST NOT render that CTA button at all.
- **FR-013**: Hero CTA targets MUST validate as either a site-
  relative path starting with `/` or an absolute `https://` URL.
- **FR-014**: The hero MUST always render on the public home page —
  if no tenant-specific hero is saved yet, a neutral professional
  default MUST render instead of an error or blank state.

#### Pathway Cards

- **FR-015**: A tenant admin MUST be able to view the current three
  pathway cards in the Admin section, each with title, short copy,
  badge, link target, image, and display order.
- **FR-016**: A tenant admin MUST be able to edit any field on any
  of the three cards.
- **FR-017**: A tenant admin MUST be able to reorder the three cards
  and have that order reflected on the public home page.
- **FR-018**: A tenant admin MUST be able to upload a new image for
  a pathway card; on successful upload, the card's image URL MUST be
  set automatically without the admin pasting a URL by hand.
- **FR-019**: The pathway cards MUST be fixed at exactly three in
  this release; the admin UI MUST NOT allow adding a fourth or
  deleting one to zero/one/two.
- **FR-020**: A card with an empty badge field MUST render on the
  public site without a badge chip.
- **FR-021**: Pathway card link targets MUST validate as either a
  site-relative path starting with `/` or an absolute `https://` URL.
- **FR-022**: The public home page MUST always render three pathway
  cards — if fewer than three are saved for the tenant, neutral
  default cards MUST fill the remaining slots.

#### Multi-Tenancy & Authorization

- **FR-023**: All site-configuration, hero, and pathway-card records
  MUST be tenant-scoped; no record MUST be readable or writable by
  an admin of a different tenant.
- **FR-024**: Only a user with a tenant-admin role (per spec 006)
  MUST be able to view or edit site configuration, hero, or pathway
  cards; non-admin tenant members MUST NOT see the editors.
- **FR-025**: Server-side authorization MUST enforce the tenant-
  admin role on every mutation endpoint; a client bypass MUST NOT be
  able to write.
- **FR-026**: Public rendering MUST return only the content
  belonging to the tenant resolved by the incoming request (per
  spec 003 tenant routing).

#### Image Handling

- **FR-027**: Pathway card image uploads MUST be scoped to the
  tenant's storage area (per spec 007 storage bucket tenant scoping).
- **FR-028**: An image upload that fails MUST NOT result in a saved
  record with a missing or broken image URL; the prior image MUST be
  retained or the save MUST be blocked.
- **FR-029**: Uploaded images MUST render at reasonable quality and
  load performance on the public home page; the existing menu-item
  image-upload pattern MUST be followed, not reinvented.

#### Rendering & Freshness

- **FR-030**: After a successful save in the admin, the updated
  content MUST become visible on the public home page within a short
  freshness window without a developer deploy or manual cache purge.
- **FR-031**: If content loading fails at render time, the home
  page MUST fall back to safe defaults and log the error rather than
  surfacing a 500 to the visitor.

### Key Entities

- **SiteConfiguration**: One record per tenant. Holds brand name,
  brand tagline, primary booking CTA label, primary booking CTA
  target, support phone (optional), support email (optional). Exactly
  one record per tenant.
- **HeroContent**: One record per tenant. Holds headline, optional
  sub-line, body paragraph, primary CTA label (optional), primary
  CTA target (optional), secondary CTA label (optional), secondary
  CTA target (optional). Exactly one record per tenant.
- **PathwayCard**: Exactly three records per tenant. Each holds
  title, short copy, badge (optional), link target, image URL, and
  display order (1-3). Display order is unique within a tenant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Shayley can change the hero headline and see it live
  on `/` in under 2 minutes, without contacting a developer and
  without a code deploy.
- **SC-002**: Shayley can swap a pathway card image (upload + save)
  and see the new image live on `/` in under 2 minutes.
- **SC-003**: Shayley can change the primary booking CTA label once
  in the admin and have that new label appear in 100% of primary
  booking CTA buttons across the Home, Menu, and Booking pages.
- **SC-004**: A non-admin tenant member cannot see the Site Content
  editors; every attempt to submit a site-content mutation without
  the tenant-admin role returns an authorization error.
- **SC-005**: A brand-new tenant (no content seeded) has a home page
  that renders fully — hero, three pathway cards, header, footer —
  with professional default copy and no errors.
- **SC-006**: 100% of site-content edits made by a tenant admin of
  tenant A leave tenant B's site-content unchanged.
- **SC-007**: Zero developer deploys are required for routine copy
  or image edits to the hero, pathway cards, or site configuration
  after this feature ships.

## Assumptions

- **Existing multi-tenancy foundation**: Tenant scoping, tenant
  routing, per-tenant storage, tenant-admin role, and the admin
  shell (specs 002, 003, 006, 007, 008) are in place and this
  feature builds on top of them rather than reinventing them.
- **Admin image-upload pattern is reusable**: The pattern used by
  the menu-item image upload (client posts to an admin API route
  that writes to tenant-scoped Supabase Storage and returns a
  public URL) is the pattern this feature will follow.
- **Three is the right cardinality for pathway cards**: The public
  home page is designed around three pathway cards; adding/removing
  cards is out of scope for this release.
- **Brand configuration spec overlap**: Spec 005 (brand
  configuration) may have introduced or reserved some fields; this
  feature expects to live alongside it by using site-configuration
  for simple global copy (name, tagline, booking CTA, support
  contact) and not for theming/colors/typography.
- **Copy voice is owned by the client**: Defaults shipped by
  engineering are neutral placeholders only; Shayley owns every
  shipped word on a real tenant.
- **Caching freshness**: The app may use Next.js caching on the
  public home page; "short freshness window" (FR-030) means on the
  order of seconds to a single-digit minute — not instant, but not
  "needs a deploy."
- **Role-gated UI uses existing admin shell**: The new editors live
  under the existing tenant-admin shell (spec 008) and inherit its
  authentication/authorization patterns.
