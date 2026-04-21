# Data Model: Admin-Editable Hero and Pathway Cards

**Feature**: 012-admin-editable-hero-and-cards
**Date**: 2026-04-21

## Overview

Three new Postgres tables are introduced, all tenant-scoped and
protected by row-level security. `site_configuration` and
`hero_content` are singletons (one row per tenant). `pathway_cards`
is a small fixed-cardinality table (exactly three rows per tenant,
keyed by `display_order` 1-3).

A trigger on `tenants AFTER INSERT` auto-seeds the three records
for any newly created tenant, using neutral professional defaults
so brand-new tenants render a complete home page from day one
(FR-014, FR-022, FR-031).

---

## Table: `site_configuration`

**Cardinality**: exactly 1 row per tenant.

| Column | Type | Constraints |
|--------|------|-------------|
| `tenant_id` | `uuid` | **PK**, `REFERENCES tenants(id) ON DELETE CASCADE` |
| `brand_name` | `text` | `NOT NULL`, `length(brand_name) BETWEEN 1 AND 80` |
| `brand_tagline` | `text` | `NOT NULL DEFAULT ''`, `length(brand_tagline) <= 140` |
| `booking_cta_label` | `text` | `NOT NULL`, `length(booking_cta_label) BETWEEN 1 AND 32` |
| `booking_cta_target` | `text` | `NOT NULL`, `length(booking_cta_target) <= 2048`, validated by application as relative (`/...`) or `https://` |
| `support_phone` | `text` | `NULL`ABLE, `length(support_phone) <= 32` |
| `support_email` | `text` | `NULL`ABLE, `length(support_email) <= 254`, validated by application as email when non-null |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_by` | `uuid` | `NULL`ABLE, `REFERENCES auth.users(id) ON DELETE SET NULL` |

**Indexes**: primary key on `tenant_id` is sufficient.

---

## Table: `hero_content`

**Cardinality**: exactly 1 row per tenant.

| Column | Type | Constraints |
|--------|------|-------------|
| `tenant_id` | `uuid` | **PK**, `REFERENCES tenants(id) ON DELETE CASCADE` |
| `headline` | `text` | `NOT NULL`, `length(headline) BETWEEN 1 AND 120` |
| `sub_line` | `text` | `NOT NULL DEFAULT ''`, `length(sub_line) <= 80` |
| `body` | `text` | `NOT NULL`, `length(body) BETWEEN 1 AND 400` |
| `primary_cta_label` | `text` | `NOT NULL DEFAULT ''`, `length(primary_cta_label) <= 32` |
| `primary_cta_target` | `text` | `NOT NULL DEFAULT ''`, `length(primary_cta_target) <= 2048` |
| `secondary_cta_label` | `text` | `NOT NULL DEFAULT ''`, `length(secondary_cta_label) <= 32` |
| `secondary_cta_target` | `text` | `NOT NULL DEFAULT ''`, `length(secondary_cta_target) <= 2048` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_by` | `uuid` | `NULL`ABLE, `REFERENCES auth.users(id) ON DELETE SET NULL` |

**Render rule** (enforced in the home-page component, not the DB):
- If `sub_line` is empty, no sub-line element is rendered.
- If `{primary,secondary}_cta_label` is empty, that CTA button is
  not rendered. Label is the authoritative "is this CTA active?"
  signal; target without label = no button.

**Indexes**: primary key on `tenant_id` is sufficient.

---

## Table: `pathway_cards`

**Cardinality**: exactly 3 rows per tenant, with
`display_order ∈ {1, 2, 3}`.

| Column | Type | Constraints |
|--------|------|-------------|
| `tenant_id` | `uuid` | `NOT NULL`, `REFERENCES tenants(id) ON DELETE CASCADE` |
| `display_order` | `smallint` | `NOT NULL`, `CHECK (display_order BETWEEN 1 AND 3)` |
| `title` | `text` | `NOT NULL`, `length(title) BETWEEN 1 AND 80` |
| `body` | `text` | `NOT NULL`, `length(body) BETWEEN 1 AND 200` |
| `badge` | `text` | `NOT NULL DEFAULT ''`, `length(badge) <= 24` |
| `link_target` | `text` | `NOT NULL`, `length(link_target) <= 2048` |
| `image_url` | `text` | `NOT NULL`, `length(image_url) BETWEEN 1 AND 2048` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_by` | `uuid` | `NULL`ABLE, `REFERENCES auth.users(id) ON DELETE SET NULL` |

**Composite primary key**: `(tenant_id, display_order)`.

**Indexes**: the composite PK covers every query (`WHERE tenant_id = ?`
ORDER BY display_order ASC).

**Render rule**: badge is hidden on the public site when empty.

---

## Row-Level Security

RLS is enabled on all three tables. Policies reuse the
`tenant_users` membership table introduced by spec 006.

Helper (already exists from spec 004 / 006, referenced here):
```sql
-- Returns TRUE when the calling auth.uid() has an "admin" or "owner"
-- role in the given tenant.
CREATE OR REPLACE FUNCTION public.is_tenant_admin(t uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = t
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
  );
$$;
```
(If the helper name differs in the existing codebase, reuse the
existing one rather than creating a new one.)

### `site_configuration`

```sql
ALTER TABLE public.site_configuration ENABLE ROW LEVEL SECURITY;

-- Public read for a tenant's own content (server-side; anon key can read).
CREATE POLICY "site_configuration_read_own_tenant"
  ON public.site_configuration
  FOR SELECT
  USING (true);  -- Public read is acceptable; content is already public.

-- Writes restricted to tenant admins.
CREATE POLICY "site_configuration_write_admin"
  ON public.site_configuration
  FOR UPDATE
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "site_configuration_insert_admin"
  ON public.site_configuration
  FOR INSERT
  WITH CHECK (public.is_tenant_admin(tenant_id));

-- No DELETE policy = no user can delete; deletes only happen via
-- tenant cascade.
```

### `hero_content`

Identical policy shape to `site_configuration`.

### `pathway_cards`

Identical policy shape, with one addition: the `UPDATE` and `INSERT`
policies also guard `display_order BETWEEN 1 AND 3`. The application
layer is responsible for ensuring exactly three rows exist per
tenant.

---

## Tenant-Seed Trigger

```sql
CREATE OR REPLACE FUNCTION public.seed_site_content_for_tenant()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.site_configuration
    (tenant_id, brand_name, brand_tagline, booking_cta_label,
     booking_cta_target, support_phone, support_email)
  VALUES
    (NEW.id, NEW.name, '', 'Book the Cart', '/contact', NULL, NULL)
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.hero_content
    (tenant_id, headline, sub_line, body,
     primary_cta_label, primary_cta_target,
     secondary_cta_label, secondary_cta_target)
  VALUES
    (NEW.id,
     'An elevated approach to hosting, designed to be experienced.',
     'Snacks & sips, served your way.',
     'The Social Spread is a luxury mobile cart bringing curated bites and signature sips directly to your event so you can host effortlessly and leave a lasting impression.',
     'Start Your Order', '/contact',
     'Browse the Menu', '/menu')
  ON CONFLICT (tenant_id) DO NOTHING;

  INSERT INTO public.pathway_cards
    (tenant_id, display_order, title, body, badge, link_target, image_url)
  VALUES
    (NEW.id, 1,
     'Pickup for gifting and easy hosting',
     'Order polished boxes, charcuterie cups, and bundles when you want something special without full-service catering.',
     'Fastest path', '/menu',
     '/food/charcuterie-spread.jpg'),
    (NEW.id, 2,
     'Cart service that becomes part of the decor',
     'A styled setup for showers, weddings, community activations, school events, and private gatherings that deserve a focal point.',
     'Event favorite', '/contact',
     '/client/cart-umbrella-wide.jpg'),
    (NEW.id, 3,
     'Pop-ups worth planning around',
     'Keep an eye on public events for signature sips, grab-and-go bites, and seasonal specials around Northwest Arkansas.',
     'Community favorite', '/events',
     '/client/cart-dirty-soda-hero.jpg')
  ON CONFLICT (tenant_id, display_order) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tenants_seed_site_content
AFTER INSERT ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.seed_site_content_for_tenant();
```

The same block is run as a one-time `INSERT ... SELECT FROM tenants`
for all pre-existing tenants as part of the migration.

---

## TypeScript Types (generated + exported)

After the migration applies, regenerate DB types (see R-007). The
service file re-exports narrow domain types:

```ts
// src/lib/types/site-content.ts (or co-located)
export type SiteConfiguration = {
  tenantId: string;
  brandName: string;
  brandTagline: string;
  bookingCtaLabel: string;
  bookingCtaTarget: string;
  supportPhone: string | null;
  supportEmail: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type HeroContent = {
  tenantId: string;
  headline: string;
  subLine: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaTarget: string;
  secondaryCtaLabel: string;
  secondaryCtaTarget: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type PathwayCard = {
  tenantId: string;
  displayOrder: 1 | 2 | 3;
  title: string;
  body: string;
  badge: string;
  linkTarget: string;
  imageUrl: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type HomePageContent = {
  siteConfig: SiteConfiguration;
  hero: HeroContent;
  pathwayCards: [PathwayCard, PathwayCard, PathwayCard];
};
```

Zod schemas mirror the DB length limits from R-005 and the target-
URL rule from R-006.

---

## Validation Rules Summary

| Rule | Enforced at | Source |
|------|-------------|--------|
| Length limits (all text fields) | DB `CHECK` + Zod in service | R-005 |
| Email format | Zod (service layer) | Application only — DB stays permissive |
| Link target shape (`/...` or `https://...`) | Zod | R-006 |
| Exactly 3 pathway cards | Application (service upsert) + migration invariant | Spec FR-019 |
| Tenant isolation | RLS + service `tenantId` guard | Spec FR-023 |
| Admin-only writes | RLS (`is_tenant_admin`) + route-handler role check | Spec FR-024 / FR-025 |

---

## State Transitions

None. All three entities are "edited in place." There is no
draft/publish, no archive, no soft-delete. `updated_at` and
`updated_by` exist purely for auditing; they are not user-visible.
