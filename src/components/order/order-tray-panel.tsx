"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

const STORAGE_KEY = "socialspreadcart:order-tray";
const EVENT_NAME = "order-tray-updated";

export type LocalOrderTrayItem = {
  menuItemId: string;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
  notes: string;
};

function readTray(): LocalOrderTrayItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTray(items: LocalOrderTrayItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function addOrderTrayItem(item: Omit<LocalOrderTrayItem, "quantity" | "notes">) {
  const current = readTray();
  const existing = current.find((entry) => entry.menuItemId === item.menuItemId);

  if (existing) {
    writeTray(
      current.map((entry) =>
        entry.menuItemId === item.menuItemId
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry,
      ),
    );
    return;
  }

  writeTray([...current, { ...item, quantity: 1, notes: "" }]);
}

export function clearOrderTray() {
  if (typeof window === "undefined") return;
  writeTray([]);
}

export function getOrderTrayItems() {
  return readTray();
}

export function OrderTrayPanel({
  mode = "full",
}: {
  mode?: "full" | "summary";
}) {
  const [items, setItems] = React.useState<LocalOrderTrayItem[]>([]);

  React.useEffect(() => {
    const sync = () => setItems(readTray());
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const updateQuantity = (menuItemId: string, quantity: number) => {
    const next = items
      .map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      )
      .filter((item) => item.quantity > 0);
    setItems(next);
    writeTray(next);
  };

  const updateNotes = (menuItemId: string, notes: string) => {
    const next = items.map((item) =>
      item.menuItemId === menuItemId ? { ...item, notes } : item,
    );
    setItems(next);
    writeTray(next);
  };

  const removeItem = (menuItemId: string) => {
    const next = items.filter((item) => item.menuItemId !== menuItemId);
    setItems(next);
    writeTray(next);
  };

  if (mode === "summary") {
    return (
      <Card className="rounded-[24px] border-[#e4dbc9] bg-[#fffaf4] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#eef4e9] p-3 text-sage">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                Order Tray
              </p>
              <p className="font-heading text-2xl text-[#284237]">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <p className="font-heading text-2xl text-[#284237]">
            {formatPrice(subtotal)}
          </p>
        </div>
        <Button className="mt-4 w-full" asChild disabled={itemCount === 0}>
          <Link href="/order-tray">Review Order Tray</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="rounded-[28px] border-[#e4dbc9] bg-white p-6">
      <div className="flex flex-col gap-4 border-b border-sage/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
            Order Tray
          </p>
          <h1 className="mt-2 font-heading text-4xl text-[#284237]">
            Review your order
          </h1>
        </div>
        <p className="font-heading text-3xl text-[#284237]">
          {formatPrice(subtotal)}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-ink/20" />
          <p className="mt-4 font-heading text-3xl text-[#284237]">
            Your Order Tray is empty.
          </p>
          <p className="mt-2 text-sm text-ink/55">
            Add a menu item before continuing to checkout.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/menu">Browse Menu</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-sage/10">
          {items.map((item) => (
            <div key={item.menuItemId} className="grid gap-4 py-5 md:grid-cols-[96px_1fr_auto]">
              <div className="overflow-hidden rounded-[20px] bg-[#f5efe3]">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={160}
                  height={160}
                  className="aspect-square h-full w-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-heading text-3xl text-[#284237]">{item.name}</h2>
                <p className="mt-1 text-sm text-ink/55">{formatPrice(item.priceCents)} each</p>
                <label className="mt-4 block">
                  <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
                    Item note
                  </span>
                  <textarea
                    value={item.notes}
                    onChange={(event) => updateNotes(item.menuItemId, event.target.value)}
                    rows={2}
                    placeholder="Optional prep or handoff note"
                    className="mt-2 w-full rounded-[18px] border border-sage/15 bg-[#fffaf4] px-4 py-3 text-sm outline-none focus:border-sage"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    className="rounded-full border border-sage/15 p-2 text-sage"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    className="rounded-full border border-sage/15 p-2 text-sage"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl text-[#284237]">
                    {formatPrice(item.priceCents * item.quantity)}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-red-600"
                    onClick={() => removeItem(item.menuItemId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 border-t border-sage/10 pt-5 sm:flex-row sm:justify-between">
          <Button variant="outline" asChild>
            <Link href="/menu">Add More Items</Link>
          </Button>
          <Button asChild>
            <Link href="/checkout">Continue to Checkout</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
