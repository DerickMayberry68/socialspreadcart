/**
 * Neutral 404 page — rendered for unknown tenant slugs and missing routes.
 *
 * Intentionally uses NO per-tenant brand tokens. Tenant resolution may have
 * failed, so CSS variables from Spec 005 are unavailable. Uses hardcoded
 * SocialSpreadCart platform colours.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f9f5f0] px-6 text-center">
      <div className="max-w-md space-y-6">
        <p className="text-sm font-semibold tracking-widest uppercase text-[#8a9e8a]">
          404
        </p>

        <h1 className="text-3xl font-semibold text-[#2c3a2c] leading-snug">
          We couldn&rsquo;t find that cart.
        </h1>

        <p className="text-[#5a6e5a] text-base">
          The page you&rsquo;re looking for doesn&rsquo;t exist, or the cart
          may have moved to a new address.
        </p>

        <Link
          href="/"
          className="inline-block mt-2 px-6 py-3 rounded-full bg-[#8a9e8a] text-white text-sm font-medium hover:bg-[#7a8e7a] transition-colors"
        >
          Back to SocialSpreadCart
        </Link>
      </div>
    </main>
  );
}
