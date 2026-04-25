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

export type GallerySectionContent = {
  tenant_id: string;
  eyebrow: string;
  title: string;
  description: string;
  feature_card_eyebrow: string;
  feature_card_title: string;
  support_card_body: string;
  updated_at: string;
  updated_by: string | null;
};

export type GalleryImage = {
  id: string;
  tenant_id: string;
  display_order: number;
  title: string;
  eyebrow: string;
  alt_text: string;
  image_url: string;
  storage_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type AboutPageContentRecord = {
  tenant_id: string;
  eyebrow: string;
  title: string;
  description: string;
  story_badge: string;
  story_title: string;
  story_body: string[];
  updated_at: string;
  updated_by: string | null;
};

export type AboutImage = {
  id: string;
  tenant_id: string;
  display_order: number;
  image_url: string;
  storage_path: string | null;
  alt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type AboutFeatureCard = {
  tenant_id: string;
  display_order: 1 | 2 | 3;
  title: string;
  body: string;
  icon_key: "heart-handshake" | "sparkles" | "map-pin";
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

export type GalleryPageContent = {
  section: GallerySectionContent;
  images: GalleryImage[];
};

export type AboutPageContent = {
  content: AboutPageContentRecord;
  images: AboutImage[];
  featureCards: [AboutFeatureCard, AboutFeatureCard, AboutFeatureCard];
};

export type MarketingPageKey =
  | "shell"
  | "home"
  | "menu"
  | "events"
  | "cart-service"
  | "contact";

export type EditableImage = {
  image_url: string;
  alt_text: string;
};

export type ShellNavigationItem = {
  title: string;
  href: string;
};

export type ShellMarketingContent = {
  navigation: ShellNavigationItem[];
  header_top_left: string;
  header_top_right: string;
  booking_cta_label: string;
  booking_cta_target: string;
  footer_cta_eyebrow: string;
  footer_cta_title: string;
  footer_description: string;
  location: string;
  phone: string;
  email: string;
  instagram_label: string;
  instagram_url: string;
};

export type MarketingStat = {
  label: string;
  value: string;
  note: string;
};

export type MarketingCard = {
  title: string;
  body: string;
};

export type HomePageMarketingContent = {
  hero_badge: string;
  hero_kicker: string;
  hero_main_image: EditableImage;
  hero_main_image_left_label: string;
  hero_main_image_right_label: string;
  hero_feature_image: EditableImage;
  hero_feature_eyebrow: string;
  hero_feature_title: string;
  hero_service_cards: string[];
  proof_stats: MarketingStat[];
  pillars: MarketingCard[];
  menu_section: {
    eyebrow: string;
    title: string;
    description: string;
    support_eyebrow: string;
    support_title: string;
    support_points: string[];
    cta_label: string;
    cta_target: string;
  };
  pathway_section: {
    eyebrow: string;
    title: string;
    description: string;
  };
  booking_section: {
    eyebrow: string;
    title: string;
    description: string;
    steps: string[];
    cards: MarketingCard[];
  };
  cart_section: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: string[];
    cta_label: string;
    cta_target: string;
  };
  events_section: {
    eyebrow: string;
    title: string;
    description: string;
    cta_label: string;
    cta_target: string;
  };
  testimonials_section: {
    eyebrow: string;
    title: string;
    description: string;
  };
  final_cta: {
    eyebrow: string;
    title: string;
    description: string;
    secondary_cta_label: string;
    secondary_cta_target: string;
  };
};

export type MenuPageMarketingContent = {
  eyebrow: string;
  title: string;
  description: string;
  intro_badge: string;
  intro_title: string;
  intro_body: string;
  cards: MarketingCard[];
};

export type EventsPageMarketingContent = {
  eyebrow: string;
  title: string;
  description: string;
  cards: Array<{
    eyebrow: string;
    body: string;
  }>;
};

export type CartServicePageMarketingContent = {
  eyebrow: string;
  title: string;
  description: string;
  gallery: EditableImage[];
  included_title: string;
  highlights: string[];
  service_chips: string[];
  cta_label: string;
  cta_target: string;
};

export type ContactPageMarketingContent = {
  eyebrow: string;
  title: string;
  description: string;
  planning_title: string;
  planning_body: string;
  contact_cards: Array<{
    label: string;
    value: string;
  }>;
  quote_form: {
    success_title: string;
    success_body: string;
    success_button_label: string;
    header_eyebrow: string;
    header_title: string;
    header_description: string;
    header_badge: string;
    name_label: string;
    email_label: string;
    phone_label: string;
    event_date_label: string;
    event_type_label: string;
    event_type_placeholder: string;
    guests_label: string;
    services_label: string;
    message_label: string;
    message_optional_label: string;
    message_placeholder: string;
    submit_label: string;
    submitting_label: string;
  };
};

export type MarketingPageContentByKey = {
  shell: ShellMarketingContent;
  home: HomePageMarketingContent;
  menu: MenuPageMarketingContent;
  events: EventsPageMarketingContent;
  "cart-service": CartServicePageMarketingContent;
  contact: ContactPageMarketingContent;
};

export type MarketingPageContentRecord<TKey extends MarketingPageKey = MarketingPageKey> = {
  tenant_id: string;
  page_key: TKey;
  content: MarketingPageContentByKey[TKey];
  updated_at: string;
  updated_by: string | null;
};
