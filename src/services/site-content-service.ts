/**
 * SiteContentService — canonical data-access layer for
 * admin-editable public content (site configuration, hero
 * content, pathway cards).
 *
 * Contract:
 *   - All reads return a fully-populated value, falling back
 *     through (tenant DB row -> in-memory defaults) so the
 *     public site never renders empty fields.
 *   - All writes require the caller to pass an authenticated
 *     user id and the active tenant id. RLS enforces that the
 *     user is actually an admin of that tenant.
 *   - Writes invalidate the per-tenant Next.js cache tag so the
 *     public home page re-renders immediately after save.
 *
 * See specs/012-admin-editable-hero-and-cards/plan.md and
 * research.md for the rationale behind each decision.
 */

import { randomUUID } from "node:crypto";

import { cache } from "react";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  fallbackAboutContent as DEFAULT_ABOUT_CONTENT,
  fallbackAboutFeatureCards as DEFAULT_ABOUT_FEATURE_CARDS,
  fallbackAboutImages as DEFAULT_ABOUT_IMAGES,
  fallbackGallery,
  fallbackGallerySection as DEFAULT_GALLERY_SECTION,
} from "@/lib/fallback-data";
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_PATHWAY_CARDS,
  DEFAULT_SITE_CONFIGURATION,
} from "@/lib/site";
import {
  DEFAULT_MARKETING_PAGE_CONTENT,
  MARKETING_PAGE_KEYS,
} from "@/lib/page-content-defaults";
import type {
  AboutFeatureCard,
  AboutImage,
  AboutPageContent,
  AboutPageContentRecord,
  GalleryImage,
  GalleryPageContent,
  GallerySectionContent,
  HeroContent,
  HomePageContent,
  MarketingPageContentByKey,
  MarketingPageContentRecord,
  MarketingPageKey,
  PathwayCard,
  SiteConfiguration,
} from "@/lib/types/site-content";
import {
  aboutContentPatchSchema,
  galleryContentPatchSchema,
  heroContentPatchSchema,
  marketingPageContentSchemas,
  pathwayCardsPatchSchema,
  siteConfigurationPatchSchema,
} from "@/lib/validation/site-content";

const uuid = z.string().uuid();
const marketingPageKeySchema = z.enum(MARKETING_PAGE_KEYS);

export const SITE_CONTENT_CACHE_TAG = (tenantId: string) =>
  `site-content:${tenantId}`;

function fallbackSiteConfig(tenantId: string): SiteConfiguration {
  return {
    tenant_id: tenantId,
    ...DEFAULT_SITE_CONFIGURATION,
    updated_at: new Date(0).toISOString(),
    updated_by: null,
  };
}

function fallbackHero(tenantId: string): HeroContent {
  return {
    tenant_id: tenantId,
    ...DEFAULT_HERO_CONTENT,
    updated_at: new Date(0).toISOString(),
    updated_by: null,
  };
}

function fallbackPathwayCards(
  tenantId: string,
): [PathwayCard, PathwayCard, PathwayCard] {
  const now = new Date(0).toISOString();
  return DEFAULT_PATHWAY_CARDS.map((card) => ({
    tenant_id: tenantId,
    ...card,
    updated_at: now,
    updated_by: null,
  })) as [PathwayCard, PathwayCard, PathwayCard];
}

function fallbackGallerySection(tenantId: string): GallerySectionContent {
  return {
    tenant_id: tenantId,
    ...DEFAULT_GALLERY_SECTION,
    updated_at: new Date(0).toISOString(),
    updated_by: null,
  };
}

function fallbackGalleryImages(tenantId: string): GalleryImage[] {
  const now = new Date(0).toISOString();
  return fallbackGallery.map((item, index) => ({
    id: item.id,
    tenant_id: tenantId,
    display_order: item.display_order ?? index + 1,
    title: item.title,
    eyebrow: item.eyebrow,
    alt_text: item.alt_text ?? item.title,
    image_url: item.image_url,
    storage_path: null,
    is_active: true,
    created_at: now,
    updated_at: now,
    updated_by: null,
  }));
}

function fallbackAboutContent(tenantId: string): AboutPageContentRecord {
  return {
    tenant_id: tenantId,
    ...DEFAULT_ABOUT_CONTENT,
    story_body: [...DEFAULT_ABOUT_CONTENT.story_body],
    updated_at: new Date(0).toISOString(),
    updated_by: null,
  };
}

function fallbackAboutImages(tenantId: string): AboutImage[] {
  const now = new Date(0).toISOString();
  return DEFAULT_ABOUT_IMAGES.map((image) => ({
    id: image.id,
    tenant_id: tenantId,
    display_order: image.display_order,
    image_url: image.image_url,
    storage_path: null,
    alt_text: image.alt_text,
    is_active: true,
    created_at: now,
    updated_at: now,
    updated_by: null,
  }));
}

function fallbackAboutFeatureCards(
  tenantId: string,
): [AboutFeatureCard, AboutFeatureCard, AboutFeatureCard] {
  const now = new Date(0).toISOString();
  return DEFAULT_ABOUT_FEATURE_CARDS.map((card) => ({
    tenant_id: tenantId,
    ...card,
    updated_at: now,
    updated_by: null,
  })) as [AboutFeatureCard, AboutFeatureCard, AboutFeatureCard];
}

function isUuid(value: string | undefined): value is string {
  return !!value && z.string().uuid().safeParse(value).success;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDefaults<T>(defaults: T, value: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(value) ? value : defaults) as T;
  }

  if (isRecord(defaults)) {
    const source = isRecord(value) ? value : {};
    const merged = Object.fromEntries(
      Object.entries(defaults).map(([key, defaultValue]) => [
        key,
        mergeDefaults(defaultValue, source[key]),
      ]),
    );

    return merged as T;
  }

  return (value ?? defaults) as T;
}

function parseMarketingPageContent<TKey extends MarketingPageKey>(
  pageKey: TKey,
  value: unknown,
): MarketingPageContentByKey[TKey] {
  const fallback = DEFAULT_MARKETING_PAGE_CONTENT[pageKey];
  const merged = mergeDefaults(fallback, value);

  switch (pageKey) {
    case "shell":
      return marketingPageContentSchemas.shell.parse(merged) as MarketingPageContentByKey[TKey];
    case "home":
      return marketingPageContentSchemas.home.parse(merged) as MarketingPageContentByKey[TKey];
    case "menu":
      return marketingPageContentSchemas.menu.parse(merged) as MarketingPageContentByKey[TKey];
    case "events":
      return marketingPageContentSchemas.events.parse(merged) as MarketingPageContentByKey[TKey];
    case "cart-service":
      return marketingPageContentSchemas["cart-service"].parse(merged) as MarketingPageContentByKey[TKey];
    case "contact":
      return marketingPageContentSchemas.contact.parse(merged) as MarketingPageContentByKey[TKey];
  }

  throw new Error(`Unsupported marketing page key: ${String(pageKey)}`);
}

function fallbackMarketingPageContent<TKey extends MarketingPageKey>(
  tenantId: string,
  pageKey: TKey,
): MarketingPageContentRecord<TKey> {
  return {
    tenant_id: tenantId,
    page_key: pageKey,
    content: DEFAULT_MARKETING_PAGE_CONTENT[pageKey],
    updated_at: new Date(0).toISOString(),
    updated_by: null,
  };
}

function revalidateMarketingPage(pageKey: MarketingPageKey) {
  const pathByKey: Record<MarketingPageKey, string> = {
    shell: "/",
    home: "/",
    menu: "/menu",
    events: "/events",
    "cart-service": "/cart-service",
    contact: "/contact",
  };

  if (pageKey === "shell") {
    revalidatePath("/", "layout");
    return;
  }

  revalidatePath(pathByKey[pageKey]);
}

function coerceAboutContent(
  row: AboutPageContentRecord | (Omit<AboutPageContentRecord, "story_body"> & { story_body: unknown }),
): AboutPageContentRecord {
  return {
    ...row,
    story_body: Array.isArray(row.story_body)
      ? row.story_body.filter((item): item is string => typeof item === "string")
      : [...DEFAULT_ABOUT_CONTENT.story_body],
  };
}

async function readGallerySectionContent(
  tenantId: string,
): Promise<{ section: GallerySectionContent; exists: boolean }> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { section: fallbackGallerySection(tenantId), exists: false };
  }

  const { data, error } = await supabase
    .from("gallery_section_content")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) {
    return { section: fallbackGallerySection(tenantId), exists: false };
  }

  return { section: data as GallerySectionContent, exists: true };
}

async function readAboutPageContent(
  tenantId: string,
): Promise<{ content: AboutPageContentRecord; exists: boolean }> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { content: fallbackAboutContent(tenantId), exists: false };
  }

  const { data, error } = await supabase
    .from("about_page_content")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) {
    return { content: fallbackAboutContent(tenantId), exists: false };
  }

  return { content: coerceAboutContent(data as never), exists: true };
}

// ── Reads ────────────────────────────────────────────────────

async function getSiteConfiguration(
  tenantId: string,
): Promise<SiteConfiguration> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackSiteConfig(tenantId);
  }

  const { data, error } = await supabase
    .from("site_configuration")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) {
    return fallbackSiteConfig(tenantId);
  }

  return data as SiteConfiguration;
}

async function getHeroContent(tenantId: string): Promise<HeroContent> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackHero(tenantId);
  }

  const { data, error } = await supabase
    .from("hero_content")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) {
    return fallbackHero(tenantId);
  }

  return data as HeroContent;
}

async function getPathwayCards(
  tenantId: string,
): Promise<[PathwayCard, PathwayCard, PathwayCard]> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackPathwayCards(tenantId);
  }

  const { data, error } = await supabase
    .from("pathway_cards")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  if (error || !data || data.length !== 3) {
    return fallbackPathwayCards(tenantId);
  }

  return data as [PathwayCard, PathwayCard, PathwayCard];
}

async function getGallerySectionContent(
  tenantId: string,
): Promise<GallerySectionContent> {
  const { section } = await readGallerySectionContent(tenantId);
  return section;
}

async function getGalleryImages(tenantId: string): Promise<GalleryImage[]> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackGalleryImages(tenantId);
  }

  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    return fallbackGalleryImages(tenantId);
  }

  // If the section row exists but every image row was lost (e.g. failed save after
  // delete), still show defaults so the public gallery and admin are not blank.
  if (data.length === 0) {
    return fallbackGalleryImages(tenantId);
  }

  return data as GalleryImage[];
}

async function getAboutPageContent(
  tenantId: string,
): Promise<AboutPageContentRecord> {
  const { content } = await readAboutPageContent(tenantId);
  return content;
}

async function getAboutImages(tenantId: string): Promise<AboutImage[]> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackAboutImages(tenantId);
  }

  const { data, error } = await supabase
    .from("about_images")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    return fallbackAboutImages(tenantId);
  }

  if (data.length === 0) {
    return fallbackAboutImages(tenantId);
  }

  return data as AboutImage[];
}

async function getAboutFeatureCards(
  tenantId: string,
): Promise<[AboutFeatureCard, AboutFeatureCard, AboutFeatureCard]> {
  uuid.parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return fallbackAboutFeatureCards(tenantId);
  }

  const { data, error } = await supabase
    .from("about_feature_cards")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("display_order", { ascending: true });

  if (error || !data || data.length !== 3) {
    return fallbackAboutFeatureCards(tenantId);
  }

  return data as [AboutFeatureCard, AboutFeatureCard, AboutFeatureCard];
}

const loadHomePageContent = cache(
  async (tenantId: string): Promise<HomePageContent> => {
    uuid.parse(tenantId);

    const [siteConfig, hero, pathwayCards] = await Promise.all([
      getSiteConfiguration(tenantId),
      getHeroContent(tenantId),
      getPathwayCards(tenantId),
    ]);

    return { siteConfig, hero, pathwayCards };
  },
);

const loadGalleryPageContent = cache(
  async (tenantId: string): Promise<GalleryPageContent> => {
    uuid.parse(tenantId);

    const { section } = await readGallerySectionContent(tenantId);
    const images = await getGalleryImages(tenantId);

    return { section, images };
  },
);

const loadAboutPageContent = cache(
  async (tenantId: string): Promise<AboutPageContent> => {
    uuid.parse(tenantId);

    const { content } = await readAboutPageContent(tenantId);
    const [images, featureCards] = await Promise.all([
      getAboutImages(tenantId),
      getAboutFeatureCards(tenantId),
    ]);

    return { content, images, featureCards };
  },
);

const getMarketingPageContent = cache(
  async <TKey extends MarketingPageKey>(
    tenantId: string,
    pageKey: TKey,
  ): Promise<MarketingPageContentRecord<TKey>> => {
    uuid.parse(tenantId);
    marketingPageKeySchema.parse(pageKey);

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return fallbackMarketingPageContent(tenantId, pageKey);
    }

    const { data, error } = await supabase
      .from("marketing_page_content")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("page_key", pageKey)
      .maybeSingle();

    if (error || !data) {
      return fallbackMarketingPageContent(tenantId, pageKey);
    }

    return {
      tenant_id: tenantId,
      page_key: pageKey,
      content: parseMarketingPageContent(pageKey, data.content),
      updated_at: String(data.updated_at),
      updated_by: (data.updated_by as string | null) ?? null,
    };
  },
);

// ── Writes (admin-only; RLS enforces role) ──────────────────

async function updateSiteConfiguration(
  tenantId: string,
  userId: string,
  patch: unknown,
): Promise<SiteConfiguration> {
  uuid.parse(tenantId);
  uuid.parse(userId);
  const parsed = siteConfigurationPatchSchema.parse(patch);

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  // Normalize empty email to null
  const support_email =
    parsed.support_email === "" ? null : parsed.support_email;
  const support_phone =
    parsed.support_phone === "" ? null : parsed.support_phone;

  const row = {
    tenant_id: tenantId,
    ...parsed,
    support_email,
    support_phone,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("site_configuration")
    .upsert(row, { onConflict: "tenant_id" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update site configuration");
  }

  revalidateTag(SITE_CONTENT_CACHE_TAG(tenantId));
  revalidatePath("/", "layout");

  return data as SiteConfiguration;
}

async function updateHeroContent(
  tenantId: string,
  userId: string,
  patch: unknown,
): Promise<HeroContent> {
  uuid.parse(tenantId);
  uuid.parse(userId);
  const parsed = heroContentPatchSchema.parse(patch);

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const row = {
    tenant_id: tenantId,
    ...parsed,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("hero_content")
    .upsert(row, { onConflict: "tenant_id" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update hero content");
  }

  revalidateTag(SITE_CONTENT_CACHE_TAG(tenantId));
  revalidatePath("/");

  return data as HeroContent;
}

async function updatePathwayCards(
  tenantId: string,
  userId: string,
  patch: unknown,
): Promise<[PathwayCard, PathwayCard, PathwayCard]> {
  uuid.parse(tenantId);
  uuid.parse(userId);
  const parsed = pathwayCardsPatchSchema.parse(patch);

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const now = new Date().toISOString();
  const rows = parsed.cards.map((card) => ({
    tenant_id: tenantId,
    ...card,
    updated_at: now,
    updated_by: userId,
  }));

  const { data, error } = await supabase
    .from("pathway_cards")
    .upsert(rows, { onConflict: "tenant_id,display_order" })
    .select()
    .order("display_order", { ascending: true });

  if (error || !data || data.length !== 3) {
    throw new Error(error?.message ?? "Failed to update pathway cards");
  }

  revalidateTag(SITE_CONTENT_CACHE_TAG(tenantId));
  revalidatePath("/");

  return data as [PathwayCard, PathwayCard, PathwayCard];
}

async function updateGalleryContent(
  tenantId: string,
  userId: string,
  patch: unknown,
): Promise<GalleryPageContent> {
  uuid.parse(tenantId);
  uuid.parse(userId);
  const parsed = galleryContentPatchSchema.parse(patch);

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const now = new Date().toISOString();
  const sectionRow = {
    tenant_id: tenantId,
    ...parsed.section,
    updated_at: now,
    updated_by: userId,
  };

  const { data: section, error: sectionError } = await supabase
    .from("gallery_section_content")
    .upsert(sectionRow, { onConflict: "tenant_id" })
    .select()
    .single();

  if (sectionError || !section) {
    throw new Error(sectionError?.message ?? "Failed to update gallery copy");
  }

  const { error: deleteError } = await supabase
    .from("gallery_images")
    .delete()
    .eq("tenant_id", tenantId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const imageRows = parsed.images
    .filter((image) => image.is_active !== false)
    .map((image, index) => ({
      id: isUuid(image.id) ? image.id : randomUUID(),
      tenant_id: tenantId,
      display_order: index + 1,
      title: image.title,
      eyebrow: image.eyebrow,
      alt_text: image.alt_text,
      image_url: image.image_url,
      storage_path: image.storage_path ?? null,
      is_active: true,
      updated_at: now,
      updated_by: userId,
    }));

  let images: GalleryImage[] = [];
  if (imageRows.length > 0) {
    const { data, error } = await supabase
      .from("gallery_images")
      .insert(imageRows)
      .select()
      .order("display_order", { ascending: true });

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update gallery images");
    }

    images = data as GalleryImage[];
  }

  revalidateTag(SITE_CONTENT_CACHE_TAG(tenantId));
  revalidatePath("/gallery");

  return { section: section as GallerySectionContent, images };
}

async function updateAboutContent(
  tenantId: string,
  userId: string,
  patch: unknown,
): Promise<AboutPageContent> {
  uuid.parse(tenantId);
  uuid.parse(userId);
  const parsed = aboutContentPatchSchema.parse(patch);

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const now = new Date().toISOString();
  const contentRow = {
    tenant_id: tenantId,
    ...parsed.content,
    updated_at: now,
    updated_by: userId,
  };

  const { data: content, error: contentError } = await supabase
    .from("about_page_content")
    .upsert(contentRow, { onConflict: "tenant_id" })
    .select()
    .single();

  if (contentError || !content) {
    throw new Error(contentError?.message ?? "Failed to update About copy");
  }

  const { error: deleteImagesError } = await supabase
    .from("about_images")
    .delete()
    .eq("tenant_id", tenantId);

  if (deleteImagesError) {
    throw new Error(deleteImagesError.message);
  }

  const imageRows = parsed.images
    .filter((image) => image.is_active !== false)
    .map((image, index) => ({
      id: isUuid(image.id) ? image.id : randomUUID(),
      tenant_id: tenantId,
      display_order: index + 1,
      image_url: image.image_url,
      storage_path: image.storage_path ?? null,
      alt_text: image.alt_text,
      is_active: true,
      updated_at: now,
      updated_by: userId,
    }));

  let images: AboutImage[] = [];
  if (imageRows.length > 0) {
    const { data, error } = await supabase
      .from("about_images")
      .insert(imageRows)
      .select()
      .order("display_order", { ascending: true });

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update About images");
    }

    images = data as AboutImage[];
  }

  const cardRows = parsed.featureCards
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((card) => ({
      tenant_id: tenantId,
      ...card,
      updated_at: now,
      updated_by: userId,
    }));

  const { data: featureCards, error: cardsError } = await supabase
    .from("about_feature_cards")
    .upsert(cardRows, { onConflict: "tenant_id,display_order" })
    .select()
    .order("display_order", { ascending: true });

  if (cardsError || !featureCards || featureCards.length !== 3) {
    throw new Error(cardsError?.message ?? "Failed to update About cards");
  }

  revalidateTag(SITE_CONTENT_CACHE_TAG(tenantId));
  revalidatePath("/about");

  return {
    content: coerceAboutContent(content as never),
    images,
    featureCards: featureCards as [
      AboutFeatureCard,
      AboutFeatureCard,
      AboutFeatureCard,
    ],
  };
}

async function updateMarketingPageContent<TKey extends MarketingPageKey>(
  tenantId: string,
  userId: string,
  pageKey: TKey,
  patch: unknown,
): Promise<MarketingPageContentRecord<TKey>> {
  uuid.parse(tenantId);
  uuid.parse(userId);
  marketingPageKeySchema.parse(pageKey);

  const content = parseMarketingPageContent(pageKey, patch);

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  const now = new Date().toISOString();
  const row = {
    tenant_id: tenantId,
    page_key: pageKey,
    content,
    updated_at: now,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("marketing_page_content")
    .upsert(row, { onConflict: "tenant_id,page_key" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update page content");
  }

  revalidateTag(SITE_CONTENT_CACHE_TAG(tenantId));
  revalidateMarketingPage(pageKey);

  return {
    tenant_id: tenantId,
    page_key: pageKey,
    content: parseMarketingPageContent(pageKey, data.content),
    updated_at: String(data.updated_at),
    updated_by: (data.updated_by as string | null) ?? null,
  };
}

export const SiteContentService = {
  getSiteConfiguration,
  getHeroContent,
  getPathwayCards,
  getGallerySectionContent,
  getGalleryImages,
  getAboutPageContent,
  getAboutImages,
  getAboutFeatureCards,
  loadHomePageContent,
  loadGalleryPageContent,
  loadAboutPageContent,
  getMarketingPageContent,
  updateSiteConfiguration,
  updateHeroContent,
  updatePathwayCards,
  updateGalleryContent,
  updateAboutContent,
  updateMarketingPageContent,
};
