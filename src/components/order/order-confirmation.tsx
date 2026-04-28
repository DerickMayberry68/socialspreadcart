"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GuestOrderSummary } from "@/lib/types/order";
import { formatPrice } from "@/lib/utils";
import { clearOrderTray } from "@/components/order/order-tray-panel";

export function OrderConfirmation({ order }: { order: GuestOrderSummary }) {
  React.useEffect(() => {
    if (order.payment_status === "paid") clearOrderTray();
  }, [order.payment_status]);

  const paid = order.payment_status === "paid";
  const Icon = paid ? CheckCircle2 : Clock;

  return (
    <div className="rounded-[28px] border border-[#e4dbc9] bg-white p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-[#eef4e9] p-3 text-sage">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
            {paid ? "Payment confirmed" : "Payment pending"}
          </p>
          <h1 className="mt-2 font-heading text-4xl text-[#284237]">
            {paid ? "Your order is in." : "We are checking payment."}
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink/62">
            Order #{order.id.slice(0, 8)} for {order.guest_name}
          </p>
        </div>
      </div>

      <div className="mt-8 divide-y divide-sage/10 rounded-[24px] border border-sage/10">
        {order.items.map((item) => (
          <div key={`${item.menu_item_id}-${item.name}`} className="flex justify-between gap-4 px-5 py-4">
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

      <div className="mt-6 flex items-center justify-between border-t border-sage/10 pt-5">
        <p className="text-sm uppercase tracking-[0.16em] text-ink/45">Total paid</p>
        <p className="font-heading text-3xl text-[#284237]">{formatPrice(order.total_cents)}</p>
      </div>

      <Button className="mt-7" asChild>
        <Link href="/menu">Back to Menu</Link>
      </Button>
    </div>
  );
}
