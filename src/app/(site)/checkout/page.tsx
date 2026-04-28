import type { Metadata } from "next";

import { CheckoutForm } from "@/components/order/checkout-form";
import { OrderTrayPanel } from "@/components/order/order-tray-panel";
import { SectionShell } from "@/components/shared/section-shell";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order and pay online.",
};

export default function CheckoutPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <CheckoutForm />
          <OrderTrayPanel mode="summary" />
        </div>
      </SectionShell>
    </div>
  );
}
