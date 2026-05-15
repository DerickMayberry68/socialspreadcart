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
  const [decisionForms, setDecisionForms] = React.useState<
    Record<string, { note: string; deliveryFee: string; expiresAt: string }>
  >({});

  const getDecisionForm = (orderId: string) =>
    decisionForms[orderId] ?? { note: "", deliveryFee: "0", expiresAt: "" };

  const updateDecisionForm = (
    orderId: string,
    key: "note" | "deliveryFee" | "expiresAt",
    value: string,
  ) => {
    setDecisionForms((current) => ({
      ...current,
      [orderId]: { ...getDecisionForm(orderId), [key]: value },
    }));
  };

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

  const decideDelivery = async (
    orderId: string,
    decision: "approve" | "decline" | "offer_pickup" | "withdraw_approval",
  ) => {
    const form = getDecisionForm(orderId);
    setUpdatingId(orderId);
    const response = await fetch(`/api/admin/orders/${orderId}/delivery-decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        note: form.note,
        deliveryFeeCents: Math.round((Number.parseFloat(form.deliveryFee || "0") || 0) * 100),
        approvalExpiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }),
    });

    setUpdatingId(null);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      toast.error(result?.message ?? "Delivery decision could not be saved.");
      return;
    }

    toast.success("Delivery decision saved.");
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
              {order.fulfillment_address && (
                <p className="mt-1 text-sm text-ink/50">
                  {[
                    order.fulfillment_address.line1,
                    order.fulfillment_address.line2,
                    order.fulfillment_address.city,
                    order.fulfillment_address.state,
                    order.fulfillment_address.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {order.fulfillment_notes && (
                <p className="mt-3 rounded-[18px] bg-[#fffaf4] px-4 py-3 text-sm text-ink/62">
                  {order.fulfillment_notes}
                </p>
              )}
              {order.delivery_decision_note && (
                <p className="mt-3 rounded-[18px] bg-[#eef4e9] px-4 py-3 text-sm text-ink/62">
                  {order.delivery_decision_note}
                </p>
              )}
            </div>

            <div className="min-w-[220px]">
              <div className="space-y-1 text-right text-sm">
                <p className="text-ink/50">Subtotal {formatPrice(order.subtotal_cents)}</p>
                <p className="text-ink/50">Tax {formatPrice(order.tax_cents)}</p>
                {(order.delivery_fee_cents ?? 0) > 0 && (
                  <p className="text-ink/50">
                    Delivery fee {formatPrice(order.delivery_fee_cents ?? 0)}
                  </p>
                )}
                <p className="text-ink/50">Processing fee {formatPrice(order.fee_cents)}</p>
                <p className="font-heading text-3xl text-[#284237]">
                  {formatPrice(order.total_cents)}
                </p>
              </div>
              <p className="mt-1 text-right text-xs uppercase tracking-[0.14em] text-ink/45">
                {order.delivery_status && order.delivery_status !== "not_required"
                  ? order.delivery_status.replaceAll("_", " ")
                  : order.payment_status}
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

          {order.fulfillment_type === "delivery" &&
            order.payment_status !== "paid" &&
            order.delivery_status !== "declined" && (
              <div className="mt-5 rounded-[22px] border border-[#e4dbc9] bg-[#fffaf4] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                  Delivery decision
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_190px]">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
                      Customer note
                    </span>
                    <input
                      value={getDecisionForm(order.id).note}
                      onChange={(event) =>
                        updateDecisionForm(order.id, "note", event.target.value)
                      }
                      className="h-11 w-full rounded-full border border-sage/15 bg-white px-4 text-sm text-ink outline-none focus:border-sage"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
                      Delivery fee
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={getDecisionForm(order.id).deliveryFee}
                      onChange={(event) =>
                        updateDecisionForm(order.id, "deliveryFee", event.target.value)
                      }
                      className="h-11 w-full rounded-full border border-sage/15 bg-white px-4 text-sm text-ink outline-none focus:border-sage"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
                      Expires
                    </span>
                    <input
                      type="datetime-local"
                      value={getDecisionForm(order.id).expiresAt}
                      onChange={(event) =>
                        updateDecisionForm(order.id, "expiresAt", event.target.value)
                      }
                      className="h-11 w-full rounded-full border border-sage/15 bg-white px-4 text-sm text-ink outline-none focus:border-sage"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => decideDelivery(order.id, "approve")}
                    className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    Approve Delivery
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => decideDelivery(order.id, "decline")}
                    className="rounded-full border border-sage/20 px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === order.id}
                    onClick={() => decideDelivery(order.id, "offer_pickup")}
                    className="rounded-full border border-sage/20 px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
                  >
                    Offer Pickup
                  </button>
                  {order.delivery_status === "approved_payment_needed" && (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => decideDelivery(order.id, "withdraw_approval")}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                    >
                      Withdraw Approval
                    </button>
                  )}
                </div>
              </div>
            )}
        </article>
      ))}
    </div>
  );
}
