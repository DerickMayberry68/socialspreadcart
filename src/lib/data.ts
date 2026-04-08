import {
  fallbackEvents,
  fallbackGallery,
  fallbackMenuItems,
  fallbackTestimonials,
} from "@/lib/fallback-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventItem, GalleryItem, MenuItem, Testimonial } from "@/lib/types";

async function queryTable<T>(table: string, fallback: T[]) {
  if (!hasSupabaseEnv()) {
    return fallback;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase.from(table).select("*");

  if (error || !data) {
    return fallback;
  }

  return data as T[];
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const items = await queryTable<MenuItem>("menu_items", fallbackMenuItems);
  return items.sort((a, b) => a.price_cents - b.price_cents);
}

export async function getEvents(): Promise<EventItem[]> {
  const items = await queryTable<EventItem>("events", fallbackEvents);
  return items.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return queryTable<Testimonial>("testimonials", fallbackTestimonials);
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return fallbackGallery;
}
