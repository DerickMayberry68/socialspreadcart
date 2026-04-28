"use client";

import * as React from "react";
import { compressUpload } from "@/lib/image-compression";
import Image from "next/image";
import {
  ImagePlus,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { MenuItem } from "@/lib/types";
import { clientMedia } from "@/lib/media";
import { formatPrice, generateUuid, slugify } from "@/lib/utils";

const emptyForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  size: "",
  dietary: "",
  occasion: "",
  lead_time: "",
  image_url: "",
  featured: false,
  is_active: true,
  order_url: "",
};

const exampleItemTemplate: MenuFormState = {
  id: "",
  name: "Example Signature Charcuterie Box",
  description:
    "An assortment of cheeses, meats, seasonal fruit, crackers, and sweet details for gifting, showers, and easy hosting.",
  price: "120.00",
  size: "Large",
  dietary: "Vegetarian Option, Gluten-Free Option",
  occasion: "Shower, Corporate, Gift",
  lead_time: "48 hours",
  image_url: clientMedia.dirtySodaAndCharcuterieBox,
  featured: true,
  is_active: true,
  order_url: "/contact#quote-form",
};

type MenuFormState = typeof emptyForm;

function toFormState(item?: MenuItem | null): MenuFormState {
  if (!item) {
    return emptyForm;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: (item.price_cents / 100).toFixed(2),
    size: item.size,
    dietary: item.dietary.join(", "),
    occasion: item.occasion.join(", "),
    lead_time: item.lead_time,
    image_url: item.image_url,
    featured: item.featured,
    is_active: item.is_active,
    order_url: item.order_url ?? "",
  };
}

function toPayload(form: MenuFormState) {
  const price = Number.parseFloat(form.price);

  return {
    id: form.id || generateUuid(),
    name: form.name.trim(),
    slug: slugify(form.name),
    description: form.description.trim(),
    price_cents: Number.isFinite(price) ? Math.round(price * 100) : 0,
    size: form.size.trim(),
    dietary: form.dietary
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    occasion: form.occasion
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    lead_time: form.lead_time.trim(),
    image_url: form.image_url.trim(),
    featured: form.featured,
    is_active: form.is_active,
    order_url: form.order_url.trim() || null,
  };
}

export function MenuItemManager({ initial }: { initial: MenuItem[] }) {
  const [items, setItems] = React.useState<MenuItem[]>(
    [...initial].sort((a, b) => a.price_cents - b.price_cents),
  );
  const [mode, setMode] = React.useState<"idle" | "create" | "edit">("idle");
  const [form, setForm] = React.useState<MenuFormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const featuredCount = items.filter((item) => item.featured).length;
  const activeCount = items.filter((item) => item.is_active).length;

  const openCreate = () => {
    setForm(emptyForm);
    setMode("create");
  };

  const createExampleItem = async () => {
    const existingExample = items.find(
      (item) => slugify(item.name) === slugify(exampleItemTemplate.name),
    );

    if (existingExample) {
      openEdit(existingExample);
      toast.success("Example item already exists. Opening it for editing.");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/admin/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(exampleItemTemplate)),
    });

    const result = (await response.json()) as {
      ok: boolean;
      item?: MenuItem;
      message?: string;
    };

    setSaving(false);

    if (!response.ok || !result.ok || !result.item) {
      toast.error(result.message ?? "Failed to create example item.");
      return;
    }

    const savedItem = result.item;
    setItems((current) =>
      [...current, savedItem].sort((a, b) => a.price_cents - b.price_cents),
    );
    toast.success("Example menu item created.");
  };

  const openEdit = (item: MenuItem) => {
    setForm(toFormState(item));
    setMode("edit");
  };

  const closeForm = () => {
    setForm(emptyForm);
    setMode("idle");
  };

  const updateForm = (key: keyof MenuFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const payload = toPayload(form);
    const response = await fetch("/api/admin/menu-items", {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      ok: boolean;
      item?: MenuItem;
      message?: string;
    };

    setSaving(false);

    if (!response.ok || !result.ok || !result.item) {
      toast.error(result.message ?? "Failed to save menu item.");
      return;
    }

    const savedItem = result.item;

    setItems((current) => {
      const exists = current.some((item) => item.id === savedItem.id);
      const next = exists
        ? current.map((item) => (item.id === savedItem.id ? savedItem : item))
        : [...current, savedItem];

      return next.sort((a, b) => a.price_cents - b.price_cents);
    });

    toast.success(mode === "edit" ? "Menu item updated." : "Menu item created.");
    closeForm();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);

    const response = await fetch("/api/admin/menu-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeleting(null);

    if (!response.ok || !result.ok) {
      toast.error(result.message ?? "Failed to delete menu item.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    toast.success("Menu item deleted.");
  };

  const handleToggleActive = async (item: MenuItem) => {
    const response = await fetch("/api/admin/menu-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        is_active: !item.is_active,
      }),
    });

    const result = (await response.json()) as {
      ok: boolean;
      item?: MenuItem;
      message?: string;
    };

    if (!response.ok || !result.ok || !result.item) {
      toast.error(result.message ?? "Failed to update visibility.");
      return;
    }

    const savedItem = result.item;
    setItems((current) =>
      current
        .map((entry) => (entry.id === savedItem.id ? savedItem : entry))
        .sort((a, b) => a.price_cents - b.price_cents),
    );
    toast.success(savedItem.is_active ? "Item is now visible on the menu." : "Item hidden from the public menu.");
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    const compressedFile = await compressUpload(file);
    const formData = new FormData();
    formData.append("file", compressedFile);

    const response = await fetch("/api/admin/menu-items/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as {
      ok: boolean;
      imageUrl?: string;
      message?: string;
    };

    setUploading(false);
    event.target.value = "";

    if (!response.ok || !result.ok || !result.imageUrl) {
      toast.error(result.message ?? "Failed to upload image.");
      return;
    }

    setForm((current) => ({ ...current, image_url: result.imageUrl ?? current.image_url }));
    toast.success("Image uploaded.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Menu manager</p>
            <h2 className="mt-3 font-heading text-3xl text-[#284237]">
              Add, update, and feature the products clients actually see.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-[20px] bg-[#fffaf4] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.13em] text-ink/45">Menu items</p>
              <p className="mt-1 font-heading text-2xl text-[#284237]">{items.length}</p>
            </div>
            <div className="rounded-[20px] bg-[#fffaf4] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.13em] text-ink/45">Visible</p>
              <p className="mt-1 font-heading text-2xl text-[#284237]">{activeCount}</p>
            </div>
            <div className="rounded-[20px] bg-[#eef4e9] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.13em] text-[#4f684d]/70">Featured</p>
              <p className="mt-1 font-heading text-2xl text-[#284237]">{featuredCount}</p>
            </div>
          </div>
        </div>

        {mode === "idle" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-cream shadow-soft transition hover:bg-sage-700"
            >
              <Plus className="h-4 w-4" />
              New menu item
            </button>
            <button
              onClick={createExampleItem}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-white px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Create example item
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-sage/10 bg-[#fcf8f1] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[#ad7a54]">
                  {mode === "edit" ? "Edit item" : "Create item"}
                </p>
                <h3 className="mt-2 font-heading text-2xl text-[#284237]">
                  {mode === "edit"
                    ? "Update this menu item."
                    : "Add a new item to the public menu."}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="rounded-full border border-sage/15 bg-white p-2 text-ink/45 transition hover:border-sage/30 hover:text-sage"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    required
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                    Price in dollars
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => updateForm("price", event.target.value)}
                    required
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">Size</span>
                  <input
                    value={form.size}
                    onChange={(event) => updateForm("size", event.target.value)}
                    required
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                    Lead time
                  </span>
                  <input
                    value={form.lead_time}
                    onChange={(event) => updateForm("lead_time", event.target.value)}
                    required
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                  Description
                </span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  required
                  className="w-full resize-none rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                    Dietary tags
                  </span>
                  <input
                    value={form.dietary}
                    onChange={(event) => updateForm("dietary", event.target.value)}
                    placeholder="Vegetarian Option, Gluten-Free Option"
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                    Occasion tags
                  </span>
                  <input
                    value={form.occasion}
                    onChange={(event) => updateForm("occasion", event.target.value)}
                    placeholder="Shower, Corporate, Gift"
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                    Image URL
                  </span>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(event) => updateForm("image_url", event.target.value)}
                    required
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.13em] text-ink/45">
                    Order URL
                  </span>
                  <input
                    value={form.order_url}
                    onChange={(event) => updateForm("order_url", event.target.value)}
                    placeholder="/contact#quote-form"
                    className="w-full rounded-[16px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sage focus:ring-1 focus:ring-sage"
                  />
                </label>
              </div>

              <div className="rounded-[20px] border border-sage/10 bg-white px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.13em] text-ink/45">
                      Upload from device
                    </p>
                    <p className="mt-1 text-sm text-ink/62">
                      Choose an image from the client&apos;s computer and we&apos;ll place the
                      hosted URL into the form automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-full border border-sage/20 px-4 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload image"}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {form.image_url ? (
                <div className="overflow-hidden rounded-[22px] border border-sage/10 bg-white">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={form.image_url}
                      alt={form.name || "Menu item preview"}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : null}

              <label className="inline-flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => updateForm("featured", event.target.checked)}
                  className="h-4 w-4 rounded border-sage/20 text-sage focus:ring-sage"
                />
                Feature this item on the homepage or priority sections
              </label>

              <label className="inline-flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => updateForm("is_active", event.target.checked)}
                  className="h-4 w-4 rounded border-sage/20 text-sage focus:ring-sage"
                />
                Show this item on the public menu
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-sage/20 px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:border-sage/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-sage px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cream transition hover:bg-sage-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : mode === "edit" ? "Update item" : "Create item"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-sage/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-sage/10 px-6 py-5">
          <div>
            <h2 className="font-heading text-3xl text-[#284237]">Current menu items</h2>
            <p className="mt-1 text-sm text-ink/50">
              These are the products your public menu will display.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#fff4ee] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#a15e50] sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Public-facing content
          </div>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-2xl text-[#284237]">No menu items yet.</p>
            <p className="mt-2 text-sm text-ink/45">
              Add your first menu item above to populate the public menu page.
            </p>
            <button
              onClick={createExampleItem}
              disabled={saving}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-cream shadow-soft transition hover:bg-sage-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Create example item
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-sage/8">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 px-6 py-5 transition hover:bg-[#fcf8f1] lg:flex-row lg:items-center"
              >
                <div className="overflow-hidden rounded-[18px] border border-sage/10 bg-[#fffaf4] lg:w-24">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={192}
                    height={144}
                    className="aspect-[4/3] h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    {item.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4e9] px-2.5 py-1 text-xs uppercase tracking-[0.12em] text-[#4f684d]">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </span>
                    )}
                    {!item.is_active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1 text-xs uppercase tracking-[0.12em] text-ink/55">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/62">
                    {item.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
                    <span>{item.size}</span>
                    <span>{formatPrice(item.price_cents)}</span>
                    <span>{item.lead_time}</span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className="rounded-full border border-sage/15 bg-white p-2.5 text-ink/50 transition hover:border-sage/30 hover:text-sage"
                    title={item.is_active ? "Hide from public menu" : "Show on public menu"}
                  >
                    {item.is_active ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-full border border-sage/15 bg-white p-2.5 text-ink/50 transition hover:border-sage/30 hover:text-sage"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="rounded-full border border-red-200 bg-white p-2.5 text-red-500 transition hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
