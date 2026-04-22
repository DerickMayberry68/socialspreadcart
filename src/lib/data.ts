import {
  fallbackEvents,
  fallbackGallery,
  fallbackMenuItems,
  fallbackTestimonials,
} from "@/lib/fallback-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { withCurrentTenant } from "@/lib/tenant";
import { EventService } from "@/services/event-service";
import { MenuService } from "@/services/menu-service";
import { SiteContentService } from "@/services/site-content-service";
import { TestimonialService } from "@/services/testimonial-service";
import type { EventItem, GalleryItem, MenuItem, Testimonial } from "@/lib/types";

export async function getMenuItems(): Promise<MenuItem[]> {
  if (!hasSupabaseEnv()) {
    return fallbackMenuItems;
  }

  const items = await withCurrentTenant(MenuService.listMenuItems);
  const source = items.length > 0 ? items : fallbackMenuItems.filter((item) => item.is_active);
  return source.sort((a, b) => a.price_cents - b.price_cents);
}

export async function getEvents(): Promise<EventItem[]> {
  if (!hasSupabaseEnv()) {
    return fallbackEvents;
  }

  const items = await withCurrentTenant(EventService.listEvents);
  return items.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!hasSupabaseEnv()) {
    return fallbackTestimonials;
  }

  return withCurrentTenant(TestimonialService.listTestimonials);
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!hasSupabaseEnv()) {
    return fallbackGallery;
  }

  const content = await withCurrentTenant(
    SiteContentService.loadGalleryPageContent,
  );
  return content.images.map((item) => ({
    id: item.id,
    title: item.title,
    eyebrow: item.eyebrow,
    image_url: item.image_url,
    alt_text: item.alt_text,
    display_order: item.display_order,
  }));
}
