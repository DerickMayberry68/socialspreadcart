"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrderTrayItems } from "@/components/order/order-tray-panel";
import { formatPrice } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  phone: string;
  fulfillmentType: "pickup" | "delivery" | "event" | "other";
  requestedAt: string;
  notes: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  fulfillmentType: "pickup",
  requestedAt: "",
  notes: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

type CheckoutStartResult = {
  orderId: string;
  paymentStatus: string;
  totals: {
    subtotalCents: number;
    taxCents: number;
    feeCents: number;
    totalCents: number;
    currency: string;
  };
  checkoutUrl: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initialState);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [itemCount, setItemCount] = React.useState(0);
  const [checkoutResult, setCheckoutResult] =
    React.useState<CheckoutStartResult | null>(null);

  React.useEffect(() => {
    setItemCount(getOrderTrayItems().reduce((total, item) => total + item.quantity, 0));
  }, []);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setCheckoutResult(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setCheckoutResult(null);

    const trayItems = getOrderTrayItems();
    if (trayItems.length === 0) {
      setError("Add at least one item to the Order Tray before checkout.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: trayItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
          options: {},
        })),
        guest: {
          name: form.name,
          email: form.email,
          phone: form.phone,
        },
        fulfillment: {
          type: form.fulfillmentType,
          requestedAt: form.requestedAt ? new Date(form.requestedAt).toISOString() : null,
          notes: form.notes,
          address: {
            line1: form.addressLine1,
            line2: form.addressLine2,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: "US",
          },
        },
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.checkoutUrl || !result?.totals) {
      setIsSubmitting(false);
      setError(result?.message ?? "Checkout could not be started.");
      if (response.status === 409) router.push("/order-tray");
      return;
    }

    setIsSubmitting(false);
    setCheckoutResult(result as CheckoutStartResult);
  };

  const needsAddress = form.fulfillmentType === "delivery" || form.fulfillmentType === "event";

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-[#e4dbc9] bg-white p-6 shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
          Checkout
        </p>
        <h1 className="mt-2 font-heading text-4xl text-[#284237]">
          Complete your order
        </h1>
        <p className="mt-2 text-sm leading-7 text-ink/58">
          {itemCount} item{itemCount === 1 ? "" : "s"} ready for payment.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Name</span>
          <Input value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Email</span>
          <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Phone</span>
          <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Fulfillment</span>
          <select
            value={form.fulfillmentType}
            onChange={(event) => update("fulfillmentType", event.target.value)}
            className="h-12 w-full rounded-3xl border border-sage/20 bg-white/85 px-4 text-sm text-ink outline-none focus:border-sage"
          >
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
            <option value="event">Event handoff</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Requested time</span>
          <Input
            type="datetime-local"
            value={form.requestedAt}
            onChange={(event) => update("requestedAt", event.target.value)}
          />
        </label>
        <label className="space-y-2 sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Fulfillment notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            rows={4}
            className="w-full rounded-[22px] border border-sage/20 bg-white/85 px-4 py-3 text-sm text-ink outline-none focus:border-sage"
          />
        </label>
        {needsAddress && (
          <>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Street address</span>
              <Input value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} required={needsAddress} />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Address line 2</span>
              <Input value={form.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-ink/45">City</span>
              <Input value={form.city} onChange={(event) => update("city", event.target.value)} required={needsAddress} />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-ink/45">State</span>
              <Input value={form.state} onChange={(event) => update("state", event.target.value)} required={needsAddress} />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-ink/45">ZIP code</span>
              <Input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} required={needsAddress} />
            </label>
          </>
        )}
      </div>

      {error && (
        <p className="mt-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {checkoutResult && (
        <div className="mt-6 rounded-[22px] border border-sage/15 bg-[#fffaf4] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
            Review total
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-medium text-ink">{formatPrice(checkoutResult.totals.subtotalCents)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink/60">Calculated tax</span>
              <span className="font-medium text-ink">{formatPrice(checkoutResult.totals.taxCents)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink/60">Non-taxable processing fee</span>
              <span className="font-medium text-ink">{formatPrice(checkoutResult.totals.feeCents)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-sage/10 pt-3 font-heading text-2xl text-[#284237]">
              <span>Total</span>
              <span>{formatPrice(checkoutResult.totals.totalCents)}</span>
            </div>
          </div>
          <Button
            className="mt-5 w-full"
            type="button"
            onClick={() => {
              window.location.href = checkoutResult.checkoutUrl;
            }}
          >
            <CreditCard className="h-4 w-4" />
            Continue to Secure Payment
          </Button>
        </div>
      )}

      {!checkoutResult && (
        <Button className="mt-6 w-full" disabled={isSubmitting}>
          <CreditCard className="h-4 w-4" />
          {isSubmitting ? "Calculating Total..." : "Review Total"}
        </Button>
      )}
    </form>
  );
}
