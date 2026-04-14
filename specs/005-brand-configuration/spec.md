# Feature Specification: Brand Configuration from Tenant Record

**Feature Branch**: `005-brand-configuration`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Move hardcoded brand tokens (palette, fonts, logos, site name, contact info) out of code and into a per-tenant brand configuration loaded from the database, so each tenant's public site renders with their own branding without a code change."

## Context

Today, brand tokens are hardcoded in five places:
- `tailwind.config.ts` — sage/cream/gold palette, font families.
- `src/lib/site.ts` — `siteConfig` with name, domain, phone, email.
- `public/brand/` — logos and photography pinned to the legacy tenant.
- `src/app/layout.tsx` — metadata title/description.
- Component-level CSS overrides in a handful of sections.

Each tenant needs to override these without a deploy. The approach is:
a `tenant_brand` table keyed by `tenant_id`, a `getTenantBrand(tenantId)`
service function, a CSS-variable-driven palette in the global stylesheet,
and per-tenant logo/photography uploaded to storage (Spec 007).

## User Scenarios & Testing

### User Story 1 — Tenant Palette Renders From Database (Priority: P1)

When a visitor loads a tenant's public site, the palette (sage, cream, gold,
ink, hover/active variants) comes from the tenant's `tenant_brand` record —
not from Tailwind hardcoded classes. Changing a color value in the database
and refreshing the browser reflects the new color without a deploy.

**Why this priority**: This is the visible proof of multi-tenancy to any
prospective customer. "Your site will actually look like yours."

**Independent Test**: Seed two tenants with different palettes. Visit each
tenant's home page. Confirm the primary action button, headings, and cream
background all match the respective tenant's brand record values.

**Acceptance Scenarios**:

1. **Given** tenant A has `primary_color = #5B733C` and tenant B has
   `primary_color = #334E68`, **When** the home page of each renders,
   **Then** the primary button's background matches the tenant's value.
2. **Given** a tenant brand record is updated, **When** the page is refreshed,
   **Then** the new colors are applied without requiring a code deploy.

---

### User Story 2 — Tenant Name And Contact Info Come From The Record (Priority: P1)

Every place the site displays the business name, phone, email, hours, or
social links — page headers, footers, contact forms, metadata — reads from
the tenant's record, not from `siteConfig`. `siteConfig` becomes a
**fallback** used only for platform-level pages (marketing site, signup,
404s).

**Why this priority**: Without this, every tenant's site says "The Social
Spread Cart" in the footer. That is the opposite of useful.

**Independent Test**: Rename a tenant in the database. Refresh the public
page. Confirm the header, footer, and browser tab title all reflect the
new name.

**Acceptance Scenarios**:

1. **Given** the tenant brand has `display_name = "Joe's Charcuterie"`,
   **When** the page renders, **Then** the header logo/text and the
   browser tab both show "Joe's Charcuterie".
2. **Given** the tenant brand has `phone = "555-1234"`, **When** the
   footer renders, **Then** it shows "555-1234" — not the fallback.

---

### User Story 3 — Logos Come From Per-Tenant Storage (Priority: P2)

Each tenant uploads their own logos (horizontal, circle, inverse) through
an admin page (deferred to a future admin spec). The public site loads
them from a per-tenant storage path; Spec 007 will scope the storage
bucket paths. For now, this feature stores the **URL** of each logo on the
`tenant_brand` record and assumes the files are already in storage at
those URLs.

**Why this priority**: Visible branding completeness. Logos are the
single biggest visual signal.

**Independent Test**: Set a tenant's `logo_horizontal_url` to a test image.
Load the page. Confirm the `<Logo variant="horizontal">` component renders
the test image, not the default brand logo.

**Acceptance Scenarios**:

1. **Given** a tenant brand has `logo_horizontal_url = "https://..."`,
   **When** a page renders a `<Logo variant="horizontal">`, **Then** the
   component uses the tenant's URL.
2. **Given** a tenant brand has no logo URL set, **When** a page renders
   a `<Logo>`, **Then** a neutral platform-level fallback is shown.

---

### User Story 4 — Typography Stays On-Brand But Tenant-Configurable (Priority: P3)

Each tenant may override the heading font and the body font via Google
Fonts names stored on the `tenant_brand` record. The platform provides a
small allowlist of fonts to prevent typography chaos.

**Why this priority**: A nice polish but not critical for V1. Most tenants
will keep the defaults.

**Independent Test**: Set a tenant's `font_heading = "Playfair Display"`.
Confirm headings render in Playfair Display.

**Acceptance Scenarios**:

1. **Given** a tenant brand sets `font_heading` to one of the allowlisted
   values, **When** the page renders, **Then** headings use that font.
2. **Given** a tenant brand sets `font_heading` to a value NOT in the
   allowlist, **When** the record is saved, **Then** the save fails with
   a validation error.

---

### Edge Cases

- **Bare-domain requests** during the transition period fall back to the
  legacy tenant brand (sarah's).
- **Missing brand record** for a newly created tenant: the platform
  defaults fill in. A default row is auto-created via a DB trigger on
  `tenant` insert (similar to the existing profiles trigger).
- **Color contrast**: the brand record is validated to ensure primary
  text colors pass AA contrast against the background color. Automatic,
  not a manual QA step.
- **Dark mode**: out of scope for V1. The brand record has no dark-mode
  tokens. Can be added later without breaking this spec.

## Requirements

### Functional Requirements

- **FR-001**: A new `public.tenant_brand` table MUST exist with at minimum:
  `tenant_id` (PK FK → tenants), `display_name`, `tagline`, `primary_color`,
  `accent_color`, `background_color`, `text_color`, `font_heading`,
  `font_body`, `logo_horizontal_url`, `logo_circle_url`, `logo_inverse_url`,
  `phone`, `email`, `hours_json`, `social_instagram`, `social_facebook`,
  `social_tiktok`, `updated_at`.
- **FR-002**: A DB trigger MUST insert a default `tenant_brand` row
  (populated from platform defaults) whenever a new `tenants` row is
  inserted.
- **FR-003**: A `BrandService.getBrand(tenantId)` service function MUST
  return the brand record, throwing if none exists.
- **FR-004**: The root layout (`src/app/layout.tsx`) MUST call
  `getCurrentTenant()` + `BrandService.getBrand(tenantId)` server-side
  and render a `<style>` tag injecting the tenant's colors as CSS
  variables (`--color-primary`, `--color-accent`, etc.).
- **FR-005**: `tailwind.config.ts` MUST reference those CSS variables for
  the brand color tokens instead of hardcoded hex values.
- **FR-006**: The existing `siteConfig` constant MUST become a fallback
  object used ONLY for platform-level pages (marketing, signup, 404).
  All tenant-facing pages MUST read from the brand record.
- **FR-007**: The `<Logo>` component MUST accept an optional `brand` prop;
  if absent, it reads from an in-request cached brand via `getCurrentBrand()`.
- **FR-008**: The brand record MUST be request-cached via `cache()` so
  multiple components on the same page do not each re-query.
- **FR-009**: Font family values MUST be validated against an allowlist
  of Google Fonts names (starting set: `Fraunces`, `Playfair Display`,
  `Cormorant`, `Inter`, `DM Sans`, `Work Sans`). Non-allowlisted values
  MUST fail the Zod schema.
- **FR-010**: A fallback brand (platform default) MUST be available as a
  typed constant in `src/lib/tenant/default-brand.ts` for use when no
  tenant context exists or the DB record is missing.

### Key Entities

- **TenantBrand**: One row per tenant. Holds all branding-related fields.
  Linked to `tenants` via PK FK.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero hardcoded hex color values exist in `src/components/`
  or `src/app/` source files (audited by grep).
- **SC-002**: Changing `primary_color` on a tenant's `tenant_brand` row
  and refreshing the page reflects the new color within 1 second.
- **SC-003**: Two tenants rendered side-by-side show two visibly distinct
  color schemes using the same components.
- **SC-004**: No existing Feature 001 page visually regresses when the
  legacy tenant's default brand record is in place.
- **SC-005**: A new tenant created via direct DB insert (before Spec 009
  signup flow) automatically has a default brand row created by the
  trigger and renders a working default-themed site immediately.

## Assumptions

- CSS variables are the chosen injection mechanism. The alternative —
  runtime Tailwind class generation — is rejected because Tailwind is
  purged at build time.
- Logo storage paths are simple URLs for this feature. Spec 007 will
  scope the storage buckets per-tenant; until then, logos can live
  anywhere public-readable.
- Font loading uses Next.js `next/font/google` at build time for the
  allowlisted set. Tenants cannot introduce arbitrary fonts at runtime.
- The default/fallback brand values are the current SocialSpreadCart
  values (cream/sage/gold), so the legacy tenant sees no visual change.
- This feature does NOT introduce an admin UI for editing brand values.
  That is a separate UI feature that depends on Spec 008 (admin
  multi-tenant shell). For now, brand records are edited directly via
  SQL or the Supabase dashboard.
