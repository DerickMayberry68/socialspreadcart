/**
 * Zod schemas for admin-editable site content PATCH/PUT payloads.
 *
 * All schemas are *partial* by design because the admin forms only
 * submit the fields the editor actually touched, but the service
 * layer will also tolerate full objects.
 *
 * Length limits must stay in sync with the SQL CHECK constraints in
 * supabase/migrations/20260421_site_content.sql.
 */

import { z } from "zod";

const LOCAL_TARGET_RE = /^\/[a-zA-Z0-9\-_#?&=\/:.%@]*$/;

/**
 * link_target / booking_cta_target / primary_cta_target validator.
 *
 * Accepts:
 *   - any local path that begins with "/"  (e.g. /contact, /menu#order)
 *   - a tel: URI                            (e.g. tel:+18706543732)
 *   - a mailto: URI                         (e.g. mailto:hello@x.com)
 *   - an absolute https:// URL
 *
 * Rejects javascript:, data:, file:, empty strings, and http://.
 */
const ctaTarget = (maxLen: number) =>
  z
    .string()
    .min(1, "Required")
    .max(maxLen)
    .refine(
      (v) =>
        LOCAL_TARGET_RE.test(v) ||
        v.startsWith("tel:") ||
        v.startsWith("mailto:") ||
        /^https:\/\//.test(v),
      "Must be a site path (/...), tel:, mailto:, or https:// URL",
    );

const optionalCtaTarget = (maxLen: number) =>
  z
    .string()
    .max(maxLen)
    .refine(
      (v) =>
        v === "" ||
        LOCAL_TARGET_RE.test(v) ||
        v.startsWith("tel:") ||
        v.startsWith("mailto:") ||
        /^https:\/\//.test(v),
      "Must be a site path (/...), tel:, mailto:, or https:// URL",
    );

export const siteConfigurationPatchSchema = z
  .object({
    brand_name: z.string().trim().min(1).max(80),
    brand_tagline: z.string().max(140),
    booking_cta_label: z.string().trim().min(1).max(32),
    booking_cta_target: ctaTarget(2048),
    support_phone: z.string().max(32).nullable().optional(),
    support_email: z
      .union([z.string().email().max(254), z.literal(""), z.null()])
      .optional(),
  })
  .partial();

export const heroContentPatchSchema = z
  .object({
    headline: z.string().trim().min(1).max(120),
    sub_line: z.string().max(80),
    body: z.string().trim().min(1).max(400),
    primary_cta_label: z.string().max(32),
    primary_cta_target: optionalCtaTarget(2048),
    secondary_cta_label: z.string().max(32),
    secondary_cta_target: optionalCtaTarget(2048),
  })
  .partial();

const pathwayCardEntrySchema = z.object({
  display_order: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(200),
  badge: z.string().max(24),
  link_target: ctaTarget(2048),
  image_url: z.string().trim().min(1).max(2048),
});

export const pathwayCardsPatchSchema = z.object({
  cards: z
    .array(pathwayCardEntrySchema)
    .length(3, "Must provide exactly 3 pathway cards"),
});

export const gallerySectionPatchSchema = z.object({
  eyebrow: z.string().trim().max(40),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(500),
  feature_card_eyebrow: z.string().trim().max(60),
  feature_card_title: z.string().trim().min(1).max(220),
  support_card_body: z.string().trim().min(1).max(320),
});

const galleryImageEntrySchema = z.object({
  id: z.string().optional(),
  display_order: z.number().int().positive(),
  title: z.string().trim().min(1).max(140),
  eyebrow: z.string().trim().max(60),
  alt_text: z.string().trim().min(1).max(180),
  image_url: z.string().trim().min(1).max(2048),
  storage_path: z.string().max(2048).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const galleryContentPatchSchema = z.object({
  section: gallerySectionPatchSchema,
  images: z.array(galleryImageEntrySchema),
});

export const aboutPageContentPatchSchema = z.object({
  eyebrow: z.string().trim().max(40),
  title: z.string().trim().min(1).max(220),
  description: z.string().trim().min(1).max(600),
  story_badge: z.string().trim().max(60),
  story_title: z.string().trim().min(1).max(240),
  story_body: z
    .array(z.string().trim().min(1).max(700))
    .min(1, "At least one story paragraph is required")
    .max(4, "Use 4 story paragraphs or fewer"),
});

const aboutImageEntrySchema = z.object({
  id: z.string().optional(),
  display_order: z.number().int().positive(),
  image_url: z.string().trim().min(1).max(2048),
  storage_path: z.string().max(2048).nullable().optional(),
  alt_text: z.string().trim().min(1).max(180),
  is_active: z.boolean().optional(),
});

const aboutFeatureCardEntrySchema = z.object({
  display_order: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(220),
  icon_key: z.union([
    z.literal("heart-handshake"),
    z.literal("sparkles"),
    z.literal("map-pin"),
  ]),
});

export const aboutContentPatchSchema = z
  .object({
    content: aboutPageContentPatchSchema,
    images: z.array(aboutImageEntrySchema),
    featureCards: z
      .array(aboutFeatureCardEntrySchema)
      .length(3, "Must provide exactly 3 About feature cards"),
  })
  .refine(
    (value) => {
      const orders = value.featureCards.map((card) => card.display_order);
      return new Set(orders).size === 3 && [1, 2, 3].every((n) => orders.includes(n as 1 | 2 | 3));
    },
    {
      message: "About feature cards must include display orders 1, 2, and 3",
      path: ["featureCards"],
    },
  );

const shortText = (max = 140) => z.string().trim().min(1).max(max);
const bodyText = (max = 700) => z.string().trim().min(1).max(max);

const editableImageSchema = z.object({
  image_url: z.string().trim().min(1).max(2048),
  alt_text: shortText(180),
});

const marketingCardSchema = z.object({
  title: shortText(180),
  body: bodyText(700),
});

const marketingStatSchema = z.object({
  label: shortText(80),
  value: shortText(40),
  note: shortText(120),
});

export const shellMarketingContentSchema = z.object({
  navigation: z
    .array(
      z.object({
        title: shortText(40),
        href: ctaTarget(2048),
      }),
    )
    .min(1)
    .max(10),
  header_top_left: shortText(120),
  header_top_right: shortText(120),
  booking_cta_label: shortText(32),
  booking_cta_target: ctaTarget(2048),
  footer_cta_eyebrow: shortText(80),
  footer_cta_title: shortText(220),
  footer_description: bodyText(500),
  location: shortText(120),
  phone: shortText(32),
  email: z.string().trim().email().max(254),
  instagram_label: shortText(80),
  instagram_url: ctaTarget(2048),
});

export const homePageMarketingContentSchema = z.object({
  hero_badge: shortText(100),
  hero_kicker: shortText(120),
  hero_main_image: editableImageSchema,
  hero_main_image_left_label: shortText(60),
  hero_main_image_right_label: shortText(60),
  hero_feature_image: editableImageSchema,
  hero_feature_eyebrow: shortText(60),
  hero_feature_title: shortText(180),
  hero_service_cards: z.array(shortText(120)).length(2),
  proof_stats: z.array(marketingStatSchema).length(3),
  pillars: z.array(marketingCardSchema).length(3),
  menu_section: z.object({
    eyebrow: shortText(80),
    title: shortText(220),
    description: bodyText(500),
    support_eyebrow: shortText(80),
    support_title: shortText(180),
    support_points: z.array(bodyText(240)).min(1).max(5),
    cta_label: shortText(40),
    cta_target: ctaTarget(2048),
  }),
  pathway_section: z.object({
    eyebrow: shortText(80),
    title: shortText(220),
    description: bodyText(500),
  }),
  booking_section: z.object({
    eyebrow: shortText(80),
    title: shortText(220),
    description: bodyText(500),
    steps: z.array(bodyText(220)).min(1).max(5),
    cards: z.array(marketingCardSchema).length(3),
  }),
  cart_section: z.object({
    eyebrow: shortText(80),
    title: shortText(220),
    description: bodyText(500),
    highlights: z.array(bodyText(320)).min(1).max(8),
    cta_label: shortText(40),
    cta_target: ctaTarget(2048),
  }),
  events_section: z.object({
    eyebrow: shortText(80),
    title: shortText(220),
    description: bodyText(500),
    cta_label: shortText(40),
    cta_target: ctaTarget(2048),
  }),
  testimonials_section: z.object({
    eyebrow: shortText(80),
    title: shortText(220),
    description: bodyText(500),
  }),
  final_cta: z.object({
    eyebrow: shortText(80),
    title: shortText(240),
    description: bodyText(500),
    secondary_cta_label: shortText(40),
    secondary_cta_target: ctaTarget(2048),
  }),
});

export const menuPageMarketingContentSchema = z.object({
  eyebrow: shortText(80),
  title: shortText(240),
  description: bodyText(500),
  intro_badge: shortText(80),
  intro_title: shortText(180),
  intro_body: bodyText(500),
  cards: z.array(marketingCardSchema).length(3),
});

export const eventsPageMarketingContentSchema = z.object({
  eyebrow: shortText(80),
  title: shortText(240),
  description: bodyText(500),
  cards: z
    .array(
      z.object({
        eyebrow: shortText(80),
        body: bodyText(400),
      }),
    )
    .length(3),
});

export const cartServicePageMarketingContentSchema = z.object({
  eyebrow: shortText(80),
  title: shortText(240),
  description: bodyText(600),
  gallery: z.array(editableImageSchema).min(1).max(8),
  included_title: shortText(120),
  highlights: z.array(bodyText(360)).min(1).max(10),
  service_chips: z.array(shortText(80)).min(1).max(10),
  cta_label: shortText(40),
  cta_target: ctaTarget(2048),
});

export const contactPageMarketingContentSchema = z.object({
  eyebrow: shortText(80),
  title: shortText(240),
  description: bodyText(600),
  planning_title: shortText(120),
  planning_body: bodyText(500),
  contact_cards: z
    .array(
      z.object({
        label: shortText(80),
        value: bodyText(500),
      }),
    )
    .min(1)
    .max(6),
  quote_form: z.object({
    success_title: shortText(80),
    success_body: bodyText(400),
    success_button_label: shortText(80),
    header_eyebrow: shortText(80),
    header_title: shortText(160),
    header_description: bodyText(400),
    header_badge: shortText(80),
    name_label: shortText(80),
    email_label: shortText(80),
    phone_label: shortText(80),
    event_date_label: shortText(80),
    event_type_label: shortText(80),
    event_type_placeholder: shortText(100),
    guests_label: shortText(80),
    services_label: shortText(80),
    message_label: shortText(80),
    message_optional_label: shortText(40),
    message_placeholder: bodyText(240),
    submit_label: shortText(80),
    submitting_label: shortText(80),
  }),
});

export const marketingPageContentSchemas = {
  shell: shellMarketingContentSchema,
  home: homePageMarketingContentSchema,
  menu: menuPageMarketingContentSchema,
  events: eventsPageMarketingContentSchema,
  "cart-service": cartServicePageMarketingContentSchema,
  contact: contactPageMarketingContentSchema,
} as const;

export type SiteConfigurationPatch = z.infer<
  typeof siteConfigurationPatchSchema
>;
export type HeroContentPatch = z.infer<typeof heroContentPatchSchema>;
export type PathwayCardsPatch = z.infer<typeof pathwayCardsPatchSchema>;
export type GalleryContentPatch = z.infer<typeof galleryContentPatchSchema>;
export type AboutContentPatch = z.infer<typeof aboutContentPatchSchema>;
export type MarketingPageContentPatch =
  | z.infer<typeof shellMarketingContentSchema>
  | z.infer<typeof homePageMarketingContentSchema>
  | z.infer<typeof menuPageMarketingContentSchema>
  | z.infer<typeof eventsPageMarketingContentSchema>
  | z.infer<typeof cartServicePageMarketingContentSchema>
  | z.infer<typeof contactPageMarketingContentSchema>;
