# Research: Admin-Editable Hero and Pathway Cards

**Feature**: 012-admin-editable-hero-and-cards
**Date**: 2026-04-21
**Purpose**: Resolve all technical unknowns surfaced by `plan.md` so
Phase 1 design can proceed without `NEEDS CLARIFICATION` markers.

---

## R-001: Cache strategy for edit-to-visible freshness

**Decision**: Use Next.js App Router route-level `revalidate = 60`
on the public `(site)/page.tsx` plus explicit `revalidateTag(...)`
calls from the admin PATCH handlers. The tag is
`site-content:{tenantId}`. Reads are cached with
`unstable_cache`/`cache` wrapper tagged with the same string.

**Rationale**:
- FR-030 requires a "short freshness window" without a deploy or
  manual cache purge. 60s + tag invalidation gives instant
  invalidation on save while keeping a safety net if the
  invalidation ever misses.
- `revalidateTag` already ships in Next.js 15 and is stable,
  unlike experimental Cache Components APIs that would require
  opt-in.
- Tenant-scoped tag (`site-content:{tenantId}`) keeps invalidation
  surgical — editing tenant A's hero doesn't warm the cache on
  tenant B's pages.

**Alternatives considered**:
- `revalidate = 0` (always dynamic): acceptable but gives up
  caching entirely on a page that is visit-heavy.
- Cache Components (`use cache` directive, `cacheLife`, `cacheTag`):
  strictly better long-term, but the current code base does not yet
  opt into Cache Components and introducing the opt-in for one
  feature is larger than the feature itself.
- Manual ISR with `revalidate = 30`: doesn't guarantee the admin's
  own next view shows the change. Tag invalidation does.

---

## R-002: Admin auth/role check pattern

**Decision**: Admin route handlers under `/api/admin/site-content/...`
call `getSupabaseUser()` → reject with 401 if unauthenticated, then
call `getCurrentTenant()` → resolve the tenant, then call
`TenantService.getMembershipForUser(tenant.id, user.id)` → reject
with 403 unless role is `owner` or `admin`. Service functions accept
the resolved `tenantId` and trust it — RLS is the safety net below.

**Rationale**:
- Exact pattern used by `src/app/api/admin/menu-items/upload/route.ts`
  and the contacts/quotes admin routes, so there's a single
  well-understood auth shape.
- RLS policies on the new tables enforce the same rule at the DB
  layer, so a bug in a route handler can't leak content.

**Alternatives considered**:
- Next Server Actions for admin mutations instead of route handlers:
  works, but the existing admin UIs are REST-style (menu items uses
  POST to a route handler). Staying consistent keeps the admin code
  uniform.
- Middleware-level role gate: too coarse — middleware already
  handles auth redirects for `/admin/*`; per-route role enforcement
  keeps "admin shell visible" distinct from "admin mutation allowed."

---

## R-003: Image upload contract for pathway cards

**Decision**: New route `POST /api/admin/site-content/pathway-cards/upload`.
Accepts `multipart/form-data` with a single `file` field. Uploads
to bucket `boards` under key prefix
`{tenantId}/pathway-cards/{timestamp}-{slug}-{uuid}.{ext}`. Response
shape mirrors the menu-items upload exactly:
```
{ ok: true, imageUrl: string, path: string }
```

**Rationale**:
- Reuses the storage bucket, validation rules (image MIME type,
  sane filename), and response shape from
  `src/app/api/admin/menu-items/upload/route.ts`. Frontend code can
  be copy-adapted 1:1.
- Tenant-scoped key prefix keeps card images inside spec 007's
  tenant-scoped storage policy without a new bucket.

**Alternatives considered**:
- New bucket `site-content`: cleaner segmentation but requires a
  new storage policy and complicates spec 007. Not worth it for
  three images per tenant.
- Client-side direct upload with signed URLs: overengineered for
  admin-only low-volume uploads.

---

## R-004: Seed strategy for existing and future tenants

**Decision**:
1. Migration `20260421_site_content.sql` creates the three tables
   and, in the same transaction, inserts defaults for every existing
   `tenant` row using the current hardcoded copy from
   `src/components/sections/home-page.tsx` and `src/lib/site.ts`.
2. A Postgres trigger on `tenants` AFTER INSERT automatically
   seeds `site_configuration`, `hero_content`, and three
   `pathway_cards` for any future tenant created via spec 009 /
   010 (public signup + agency-managed provisioning).
3. `seed.sql` is updated so local dev tenants get the same
   defaults.

**Rationale**:
- Removes the "brand-new tenant has no content" class of bug at
  the database layer, not in application code.
- Keeps the safe-default fallback in application code (FR-014,
  FR-022, FR-031) as a belt-and-suspenders measure for the case
  where a row is deleted out of band or a query fails.

**Alternatives considered**:
- Only seed in app code on first admin read: fragile, depends on
  every caller checking for null.
- Seed only the existing Social Spread tenant, rely on app
  defaults for the rest: violates FR-022 when a tenant has fewer
  than three cards and complicates the admin "load into form"
  path (the form would have to load from a mix of DB + defaults).

---

## R-005: Content length limits

**Decision** (final values; UI enforces these and the service
re-validates with Zod):

| Field | Max length |
|-------|------------|
| Brand name | 80 |
| Brand tagline | 140 |
| Primary booking CTA label | 32 |
| Support phone | 32 |
| Support email | 254 |
| Hero headline | 120 |
| Hero sub-line | 80 |
| Hero body paragraph | 400 |
| Hero CTA label (primary/secondary) | 32 |
| Pathway card title | 80 |
| Pathway card body | 200 |
| Pathway card badge | 24 |
| Any CTA / link target | 2048 |

**Rationale**:
- Numbers chosen to fit the existing hero/card layout at the
  current responsive breakpoints with the brand `font-heading`.
- Align with spec FR-010 (headline has a live character count)
  and the "hero layout" constraint without dictating pixel widths.

**Alternatives considered**:
- No limits (rely on the admin's judgment): guarantees a future
  layout break the first time Shayley pastes marketing copy.
- Per-breakpoint limits: more complex than the benefit; the form
  can show a progress bar that turns amber near the cap.

---

## R-006: CTA target validation

**Decision**: A CTA / link target is valid when it is either
(a) a site-relative path that starts with `/` and contains no
whitespace, or (b) an absolute URL whose scheme is `https://`.
`http://` targets are rejected. `mailto:` and `tel:` targets are
out of scope for this feature (support phone/email live in
`site_configuration` as raw values; the footer renders them via its
own `tel:`/`mailto:` link, not via a CTA target).

**Rationale**:
- Covers every CTA use case in the spec (internal nav +
  offsite campaign links).
- Rejecting `http://` avoids mixed-content warnings on the
  public HTTPS site.

**Alternatives considered**:
- Allow `mailto:` / `tel:` as CTA targets: adds a class of UI
  ambiguity (button → opens email client) and isn't required by
  any acceptance scenario.

---

## R-007: Database type regeneration

**Decision**: Run `npx supabase gen types typescript --linked`
(matching the existing workflow) after the migration is applied to
local + remote, and commit the regenerated file wherever the
project currently stores DB types. The service file imports the
generated Row/Insert/Update types for the three new tables rather
than redefining them.

**Rationale**: Constitution Principle III (Liskov) requires DB and
TS types to stay in sync. The project already has a generated types
file; extending it is cheaper than hand-maintaining parallel types.

**Alternatives considered**:
- Hand-written TS types only: works but drifts the moment a column
  changes. Rejected.

---

## R-008: Admin route hierarchy

**Decision**: New admin pages live under
`src/app/admin/(shell)/site-content/` with three sub-routes:
`site-configuration`, `hero`, and `pathway-cards`. An optional
`site-content/page.tsx` acts as a hub linking to the three.
Navigation is added to the admin shell's sidebar (existing
structure — whatever spec 008 produced for other admin areas).

**Rationale**:
- Groups the three editors under one "Site Content" label so
  Shayley finds them together.
- Follows the `(shell)` route group convention that already wraps
  the menu-items and contacts admin pages in the shared layout.

**Alternatives considered**:
- Three top-level admin pages (`/admin/hero`, `/admin/pathway-cards`,
  `/admin/site-configuration`): clutters the sidebar. Rejected.

---

## Summary

All `NEEDS CLARIFICATION` items from `plan.md`'s Technical Context
are now resolved. Phase 1 can proceed.
