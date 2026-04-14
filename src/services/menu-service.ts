import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MenuItem } from "@/lib/types";

const createMenuItemSchema = z.object({
  tenantId: z.string().uuid(),
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price_cents: z.number().int().nonnegative(),
  size: z.string().min(1),
  dietary: z.array(z.string()),
  occasion: z.array(z.string()),
  lead_time: z.string().min(1),
  image_url: z.string().min(1),
  featured: z.boolean(),
  order_url: z.string().optional().nullable(),
});

async function listMenuItems(tenantId: string): Promise<MenuItem[]> {
  z.string().uuid().parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("price_cents", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as MenuItem[];
}

async function createMenuItem(
  input: z.input<typeof createMenuItemSchema>,
): Promise<MenuItem> {
  const parsed = createMenuItemSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      tenant_id: parsed.tenantId,
      id: parsed.id,
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      price_cents: parsed.price_cents,
      size: parsed.size,
      dietary: parsed.dietary,
      occasion: parsed.occasion,
      lead_time: parsed.lead_time,
      image_url: parsed.image_url,
      featured: parsed.featured,
      order_url: parsed.order_url ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create menu item.");
  }

  return data as MenuItem;
}

export const MenuService = {
  listMenuItems,
  createMenuItem,
};
