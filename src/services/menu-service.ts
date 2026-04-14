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
  is_active: z.boolean(),
  order_url: z.string().optional().nullable(),
});

const updateMenuItemSchema = createMenuItemSchema;

const deleteMenuItemSchema = z.object({
  tenantId: z.string().uuid(),
  id: z.string().min(1),
});

async function listMenuItems(
  tenantId: string,
  options?: { includeInactive?: boolean },
): Promise<MenuItem[]> {
  z.string().uuid().parse(tenantId);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId);

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("price_cents", { ascending: true });

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
      is_active: parsed.is_active,
      order_url: parsed.order_url ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create menu item.");
  }

  return data as MenuItem;
}

async function updateMenuItem(
  input: z.input<typeof updateMenuItemSchema>,
): Promise<MenuItem> {
  const parsed = updateMenuItemSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      tenant_id: parsed.tenantId,
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
      is_active: parsed.is_active,
      order_url: parsed.order_url ?? null,
    })
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update menu item.");
  }

  return data as MenuItem;
}

async function deleteMenuItem(
  input: z.input<typeof deleteMenuItemSchema>,
): Promise<void> {
  const parsed = deleteMenuItemSchema.parse(input);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client could not be initialised.");
  }

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("tenant_id", parsed.tenantId)
    .eq("id", parsed.id);

  if (error) {
    throw new Error(error.message);
  }
}

export const MenuService = {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
