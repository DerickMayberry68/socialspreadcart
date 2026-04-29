"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GuestOrderSummary } from "@/lib/types/order";
import { formatPrice } from "@/lib/utils";
import { clearOrderTray } from "@/components/order/order-tray-panel";

type CheckoutConfirmResponse = {
  order?: GuestOrderSummary;
};

const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_MAX_ATTEMPTS = 20;

export function OrderConfirmation({ order }: { order: GuestOrderSummary }) {
  const [currentOrder, setCurrentOrder] =
    React.useState<GuestOrderSummary>(order);

  React.useEffect(() => {
    clearOrderTray();
  }, [order.id]);

  React.useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  React.useEffect(() => {
    if (currentOrder.payment_status === "paid") return;

    let cancelled = false;
    let attempts = 0;

    async function refreshPaymentStatus() {
      attempts += 1;

      try {
        const response = await fetch(
          `/api/checkout/confirm?orderId=${encodeURIComponent(currentOrder.id)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as CheckoutConfirmResponse;

        if (!cancelled && result.order) {
          setCurrentOrder((previous) =>
            result.order &&
            result.order.payment_status !== previous.payment_status
              ? result.order
              : previous,
          );
        }
      } catch {
        // Keep the current pending state; the next interval can retry.
      }

      if (attempts >= PAYMENT_POLL_MAX_ATTEMPTS) {
        window.clearInterval(intervalId);
      }
    }

    const intervalId = window.setInterval(
      refreshPaymentStatus,
      PAYMENT_POLL_INTERVAL_MS,
    );
    void refreshPaymentStatus();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentOrder.id, currentOrder.payment_status]);

  const paid = currentOrder.payment_status === "paid";
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
            Order #{currentOrder.id.slice(0, 8)} for {currentOrder.guest_name}
          </p>
        </div>
      </div>

      <div className="mt-8 divide-y divide-sage/10 rounded-[24px] border border-sage/10">
        {currentOrder.items.map((item) => (
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
        <p className="text-sm uppercase tracking-[0.16em] text-ink/45">
          {paid ? "Total paid" : "Order total"}
        </p>
        <p className="font-heading text-3xl text-[#284237]">{formatPrice(currentOrder.total_cents)}</p>
      </div>

      <Button className="mt-7" asChild>
        <Link href="/menu">Back to Menu</Link>
      </Button>
    </div>
  );
}
