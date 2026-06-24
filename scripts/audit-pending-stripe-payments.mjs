import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or STRIPE_SECRET_KEY.",
  );
  process.exitCode = 1;
} else {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const stripe = new Stripe(stripeSecretKey);

  const { data: records, error } = await supabase
    .from("payment_records")
    .select(
      "id, order_id, provider_session_id, status, created_at, updated_at",
    )
    .eq("provider", "stripe")
    .in("status", ["pending"])
    .is("superseded_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Stripe payment audit failed: ${error.message}`);
    process.exitCode = 1;
  } else {
    const results = [];

    for (const record of records ?? []) {
      if (!record.provider_session_id) {
        results.push({
          orderId: record.order_id,
          status: record.status,
          checkoutStatus: "missing_session_id",
          actionable: true,
          createdAt: record.created_at,
        });
        continue;
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(
          record.provider_session_id,
        );
        const actionable =
          session.payment_status !== "paid" && session.status === "open";
        results.push({
          orderId: record.order_id,
          status: record.status,
          checkoutStatus: session.status,
          paymentStatus: session.payment_status,
          actionable,
          createdAt: record.created_at,
        });
      } catch (sessionError) {
        results.push({
          orderId: record.order_id,
          status: record.status,
          checkoutStatus: "lookup_failed",
          actionable: true,
          createdAt: record.created_at,
          error:
            sessionError instanceof Error
              ? sessionError.message
              : "Stripe session lookup failed.",
        });
      }
    }

    console.table(results);
    const actionableCount = results.filter((result) => result.actionable).length;
    console.log(
      `Pending Stripe records: ${results.length}; actionable sessions: ${actionableCount}.`,
    );
    if (actionableCount > 0) process.exitCode = 2;
  }
}
