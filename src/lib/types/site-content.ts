/**
 * Domain types for admin-editable site content.
 *
 * These mirror the three Postgres tables introduced by migration
 * 20260421_site_content.sql: site_configuration, hero_content,
 * and pathway_cards. Each record is tenant-scoped (tenant_id).
 *
 * See specs/012-admin-editable-hero-and-cards/data-model.md.
 */

export type SiteConfiguration = {
  tenant_id: string;
  brand_name: string;
  brand_tagline: string;
  booking_cta_label: string;
  booking_cta_target: string;
  support_phone: string | null;
  support_email: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type HeroContent = {
  tenant_id: string;
  headline: string;
  sub_line: string;
  body: string;
  primary_cta_label: string;
  primary_cta_target: string;
  secondary_cta_label: string;
  secondary_cta_target: string;
  updated_at: string;
  updated_by: string | null;
};

export type PathwayCard = {
  tenant_id: string;
  display_order: 1 | 2 | 3;
  title: string;
  body: string;
  badge: string;
  link_target: string;
  image_url: string;
  updated_at: string;
  updated_by: string | null;
};

/**
 * Bundle consumed by the public home page. Cards are always returned
 * in a tuple of 3 in display_order 1-2-3 (seeded/validated at DB level).
 */
export type HomePageContent = {
  siteConfig: SiteConfiguration;
  hero: HeroContent;
  pathwayCards: [PathwayCard, PathwayCard, PathwayCard];
};
