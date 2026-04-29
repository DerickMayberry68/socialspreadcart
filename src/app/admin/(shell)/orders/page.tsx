import type { Metadata } from "next";
import { PackageCheck } from "lucide-react";

import { OrderManager } from "@/components/admin/order-manager";
import { withCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";

export const metadata: Metadata = { title: "Orders | Admin" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const orders = await withCurrentTenant(OrderService.listOrders, params.status);
  const paidCount = orders.filter((order) => order.payment_status === "paid").length;
  const activeCount = orders.filter((order) =>
    ["paid", "preparing"].includes(order.status),
  ).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] bg-[linear-gradient(135deg,#284237_0%,#406352_100%)] px-7 py-7 text-[#f8f4ee] shadow-[0_24px_70px_rgba(40,66,55,0.16)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[#d7e2d4]">
            Guest orders
          </p>
          <h1 className="mt-4 font-heading text-5xl leading-[0.95]">
            Paid orders ready for calm fulfillment.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#eef2ed]/84">
            Review guest contact details, ordered items, payment state, and fulfillment
            timing from one tenant-scoped workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[28px] border border-[#e4dbc9] bg-[#fffaf4] px-6 py-6 shadow-soft">
            <PackageCheck className="h-7 w-7 text-sage" />
            <p className="mt-3 font-heading text-4xl text-[#284237]">{paidCount}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">Paid orders in view.</p>
          </div>
          <div className="rounded-[28px] border border-sage/10 bg-white px-6 py-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
              Active fulfillment
            </p>
            <p className="mt-3 font-heading text-4xl text-[#284237]">{activeCount}</p>
            <p className="mt-2 text-sm leading-7 text-ink/62">
              Paid or preparing orders to keep moving.
            </p>
          </div>
        </div>
      </section>

      <OrderManager orders={orders} />
    </div>
  );
}
