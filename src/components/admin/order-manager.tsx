"use client";

import * as React from "react";
import { toast } from "sonner";
import { PackageCheck } from "lucide-react";

import type { GuestOrderSummary, OrderStatus } from "@/lib/types/order";
import { formatPrice } from "@/lib/utils";

const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

function formatOrderStatus(order: GuestOrderSummary) {
  if (order.delivery_status && order.delivery_status !== "not_required") {
    return order.delivery_status.replaceAll("_", " ");
  }

  return order.payment_status.replaceAll("_", " ");
}

function formatFulfillment(order: GuestOrderSummary) {
  const date = order.fulfillment_requested_at
    ? new Date(order.fulfillment_requested_at).toLocaleString()
    : null;
  return [order.fulfillment_type, date].filter(Boolean).join(" - ");
}

function formatAddress(order: GuestOrderSummary) {
  if (!order.fulfillment_address) return null;

  return [
    order.fulfillment_address.line1,
    order.fulfillment_address.line2,
    order.fulfillment_address.city,
    order.fulfillment_address.state,
    order.fulfillment_address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

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
    <div className="overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-sage/10 bg-[#fffaf4] text-xs uppercase tracking-[0.14em] text-ink/45">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Fulfillment</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10">
            {orders.map((order) => {
              const form = getDecisionForm(order.id);
              const canDecideDelivery =
                order.fulfillment_type === "delivery" &&
                order.payment_status !== "paid" &&
                order.delivery_status !== "declined";
              const address = formatAddress(order);

              return (
                <tr
                  key={order.id}
                  className={`align-top transition ${
                    order.status === "fulfilled" || order.status === "cancelled"
                      ? "bg-ink/[0.025] text-ink/55"
                      : "hover:bg-[#fffaf4]/55"
                  }`}
                >
                  <td className="px-4 py-4">
                    <p className="font-mono text-xs font-medium text-[#284237]">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-xs text-ink/45">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "New order"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink">{order.guest_name}</p>
                    <p className="mt-1 max-w-[190px] text-xs leading-5 text-ink/55">
                      {[order.guest_email, order.guest_phone].filter(Boolean).join(" | ")}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium capitalize text-ink">
                      {formatFulfillment(order)}
                    </p>
                    {address && (
                      <p className="mt-1 max-w-[220px] text-xs leading-5 text-ink/55">
                        {address}
                      </p>
                    )}
                    {order.fulfillment_notes && (
                      <p className="mt-1 max-w-[220px] text-xs leading-5 text-ink/55">
                        {order.fulfillment_notes}
                      </p>
                    )}
                    {order.delivery_decision_note && (
                      <p className="mt-2 max-w-[220px] rounded-[10px] bg-[#eef4e9] px-3 py-2 text-xs leading-5 text-ink/62">
                        {order.delivery_decision_note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-[240px] space-y-2">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.menu_item_id}`}>
                          <p className="font-medium text-ink">{item.name}</p>
                          <p className="text-xs text-ink/50">
                            Qty {item.quantity} - {formatPrice(item.line_total_cents)}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-ink/50">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="font-heading text-2xl text-[#284237]">
                      {formatPrice(order.total_cents)}
                    </p>
                    <div className="mt-1 space-y-0.5 text-xs text-ink/50">
                      <p>Subtotal {formatPrice(order.subtotal_cents)}</p>
                      <p>Tax {formatPrice(order.tax_cents)}</p>
                      {(order.delivery_fee_cents ?? 0) > 0 && (
                        <p>Delivery {formatPrice(order.delivery_fee_cents ?? 0)}</p>
                      )}
                      <p>Fee {formatPrice(order.fee_cents)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-sage/15 bg-[#eef4e9] px-3 py-1 text-xs font-medium capitalize text-[#284237]">
                      {formatOrderStatus(order)}
                    </span>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) =>
                        updateStatus(order.id, event.target.value as OrderStatus)
                      }
                      className="mt-3 h-9 w-full rounded-full border border-sage/15 bg-white px-3 text-xs text-ink outline-none focus:border-sage"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    {canDecideDelivery ? (
                      <div className="w-[300px] space-y-2">
                        <input
                          aria-label={`Customer note for ${order.guest_name}`}
                          placeholder="Customer note"
                          value={form.note}
                          onChange={(event) =>
                            updateDecisionForm(order.id, "note", event.target.value)
                          }
                          className="h-9 w-full rounded-full border border-sage/15 bg-white px-3 text-xs text-ink outline-none focus:border-sage"
                        />
                        <div className="grid grid-cols-[96px_1fr] gap-2">
                          <input
                            aria-label={`Delivery fee for ${order.guest_name}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Fee"
                            value={form.deliveryFee}
                            onChange={(event) =>
                              updateDecisionForm(
                                order.id,
                                "deliveryFee",
                                event.target.value,
                              )
                            }
                            className="h-9 rounded-full border border-sage/15 bg-white px-3 text-xs text-ink outline-none focus:border-sage"
                          />
                          <input
                            aria-label={`Approval expiration for ${order.guest_name}`}
                            type="datetime-local"
                            value={form.expiresAt}
                            onChange={(event) =>
                              updateDecisionForm(order.id, "expiresAt", event.target.value)
                            }
                            className="h-9 rounded-full border border-sage/15 bg-white px-3 text-xs text-ink outline-none focus:border-sage"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => decideDelivery(order.id, "approve")}
                            className="rounded-full bg-sage px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => decideDelivery(order.id, "decline")}
                            className="rounded-full border border-sage/20 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-60"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => decideDelivery(order.id, "offer_pickup")}
                            className="rounded-full border border-sage/20 px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-60"
                          >
                            Pickup
                          </button>
                          {order.delivery_status === "approved_payment_needed" && (
                            <button
                              type="button"
                              disabled={updatingId === order.id}
                              onClick={() =>
                                decideDelivery(order.id, "withdraw_approval")
                              }
                              className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-60"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-ink/45">No delivery action needed</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
