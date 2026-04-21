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

import { cache } from "react";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_PATHWAY_CARDS,
  DEFAULT_SITE_CONFIGURATION,
} from "@/lib/site";
import type {
  HeroContent,
  HomePageContent,
  PathwayCard,
  SiteConfiguration,
} from "@/lib/types/site-content";
import {
  heroContentPatchSchema,
  pathwayCardsPatchSchema,
  siteConfigurationPatchSchema,
} from "@/lib/validation/site-content";

const uuid = z.string().uuid();

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

export const SiteContentService = {
  getSiteConfiguration,
  getHeroContent,
  getPathwayCards,
  loadHomePageContent,
  updateSiteConfiguration,
  updateHeroContent,
  updatePathwayCards,
};
