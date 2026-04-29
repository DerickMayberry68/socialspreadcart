"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, PackageCheck } from "lucide-react";

import type { GuestOrderSummary, OrderStatus } from "@/lib/types/order";
import { formatPrice } from "@/lib/utils";

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderManager({ orders }: { orders: GuestOrderSummary[] }) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });

    setUpdatingId(null);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      toast.error(result?.message ?? "Order status could not be updated.");
      return;
    }

    toast.success("Order status updated.");
    window.location.reload();
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-16 text-center shadow-soft">
        <PackageCheck className="mx-auto h-10 w-10 text-ink/20" />
        <p className="mt-4 font-heading text-3xl text-[#284237]">
          No guest orders yet.
        </p>
        <p className="mt-2 text-sm text-ink/50">
          Paid online orders will appear here after checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article
          key={order.id}
          className="rounded-[28px] border border-sage/10 bg-white p-6 shadow-soft"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#eef4e9] p-3 text-sage">
                  {order.payment_status === "paid" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                    #{order.id.slice(0, 8)}
                  </p>
                  <h2 className="font-heading text-3xl text-[#284237]">
                    {order.guest_name}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink/60">
                {[order.guest_email, order.guest_phone].filter(Boolean).join(" | ")}
              </p>
              <p className="mt-1 text-sm text-ink/50">
                {order.fulfillment_type}
                {order.fulfillment_requested_at
                  ? ` - ${new Date(order.fulfillment_requested_at).toLocaleString()}`
                  : ""}
              </p>
              {order.fulfillment_notes && (
                <p className="mt-3 rounded-[18px] bg-[#fffaf4] px-4 py-3 text-sm text-ink/62">
                  {order.fulfillment_notes}
                </p>
              )}
            </div>

            <div className="min-w-[220px]">
              <p className="text-right font-heading text-3xl text-[#284237]">
                {formatPrice(order.total_cents)}
              </p>
              <p className="mt-1 text-right text-xs uppercase tracking-[0.14em] text-ink/45">
                {order.payment_status}
              </p>
              <select
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(event) =>
                  updateStatus(order.id, event.target.value as OrderStatus)
                }
                className="mt-4 h-11 w-full rounded-full border border-sage/15 bg-[#fffaf4] px-4 text-sm text-ink outline-none focus:border-sage"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 divide-y divide-sage/10 rounded-[22px] border border-sage/10">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.menu_item_id}`} className="flex justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm text-ink/50">Qty {item.quantity}</p>
                  {item.notes && <p className="mt-1 text-sm text-ink/55">{item.notes}</p>}
                </div>
                <p className="font-heading text-xl text-[#284237]">
                  {formatPrice(item.line_total_cents)}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
