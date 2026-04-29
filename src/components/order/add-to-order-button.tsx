"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/types";
import { addOrderTrayItem } from "@/components/order/order-tray-panel";

export function AddToOrderButton({ item }: { item: MenuItem }) {
  return (
    <Button
      className="w-full"
      onClick={() => {
        addOrderTrayItem({
          menuItemId: item.id,
          name: item.name,
          slug: item.slug,
          priceCents: item.price_cents,
          imageUrl: item.image_url,
        });
        toast.success("Added to Order Tray");
      }}
    >
      <ShoppingBag className="h-4 w-4" />
      Add to Order Tray
    </Button>
  );
}
