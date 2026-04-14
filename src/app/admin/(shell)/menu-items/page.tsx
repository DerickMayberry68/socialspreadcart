import type { Metadata } from "next";
import { ImagePlus, ShoppingBag, Star } from "lucide-react";

import { MenuItemManager } from "@/components/admin/menu-item-manager";
import { requireRole } from "@/lib/auth/require-role";
import { MenuService } from "@/services/menu-service";

export const metadata: Metadata = { title: "Menu | Admin" };

export default async function AdminMenuItemsPage() {
  const { tenantId } = await requireRole("admin");
  const items = await MenuService.listMenuItems(tenantId, { includeInactive: true });

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-7 py-7 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[#d7e2d4]">Menu items</p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.95]">
            Give clients a clean way to keep the storefront current.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#eef2ed]/84">
            Manage pricing, imagery, descriptions, featured items, and lead times for
            the products shown on the public menu.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[28px] border border-[#e4dbc9] bg-[#fffaf4] px-6 py-6 shadow-soft">
            <ShoppingBag className="h-5 w-5 text-[#4f684d]" />
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/45">Live catalog</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              The public menu page reads directly from these tenant-scoped items.
            </p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <ImagePlus className="h-5 w-5 text-[#a15e50]" />
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/45">Image-driven</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Each item can carry its own image URL for richer merchandising.
            </p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <Star className="h-5 w-5 text-[#ad7a54]" />
            <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink/45">Featured picks</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Flag standout items so they can surface in homepage highlights.
            </p>
          </div>
        </div>
      </section>

      <MenuItemManager initial={items} />
    </div>
  );
}
