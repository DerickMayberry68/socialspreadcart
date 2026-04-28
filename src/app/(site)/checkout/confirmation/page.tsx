import type { Metadata } from "next";
import Link from "next/link";

import { OrderConfirmation } from "@/components/order/order-confirmation";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/shared/section-shell";
import { getCurrentTenant } from "@/lib/tenant";
import { OrderService } from "@/services/order-service";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Review your order confirmation and payment status.",
};

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const tenant = await getCurrentTenant();
  const order = params.orderId
    ? await OrderService.getCheckoutConfirmation({
        tenantId: tenant.id,
        orderId: params.orderId,
      })
    : null;

  return (
    <div className="py-16">
      <SectionShell>
        {order ? (
          <OrderConfirmation order={order} />
        ) : (
          <div className="rounded-[28px] border border-[#e4dbc9] bg-white p-8 text-center shadow-soft">
            <h1 className="font-heading text-4xl text-[#284237]">
              Order not found.
            </h1>
            <p className="mt-3 text-sm text-ink/55">
              We could not find that order for this site.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/menu">Back to Menu</Link>
            </Button>
          </div>
        )}
      </SectionShell>
    </div>
  );
}
