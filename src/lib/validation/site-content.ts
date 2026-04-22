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

export type SiteConfigurationPatch = z.infer<
  typeof siteConfigurationPatchSchema
>;
export type HeroContentPatch = z.infer<typeof heroContentPatchSchema>;
export type PathwayCardsPatch = z.infer<typeof pathwayCardsPatchSchema>;
export type GalleryContentPatch = z.infer<typeof galleryContentPatchSchema>;
