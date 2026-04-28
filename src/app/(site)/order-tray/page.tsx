import type { Metadata } from "next";

import { OrderTrayPanel } from "@/components/order/order-tray-panel";
import { SectionShell } from "@/components/shared/section-shell";

export const metadata: Metadata = {
  title: "Order Tray",
  description: "Review your selected menu items before checkout.",
};

export default function OrderTrayPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <OrderTrayPanel />
      </SectionShell>
    </div>
  );
}
