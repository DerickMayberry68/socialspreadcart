import type { Metadata } from "next";
import Image from "next/image";
import { AtSign, Mail, MapPin } from "lucide-react";

import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Coming Soon | The Social Spread Cart",
  description: siteConfig.description,
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 hero-glow" />

      {/* Stripe bar top */}
      <div className="absolute inset-x-0 top-0 h-2.5 bg-stripe opacity-90" />

      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        {/* Logo */}
        <div className="w-52 animate-float">
          <Image
            src="/brand/logos/logo-circle.png"
            alt="The Social Spread Cart"
            width={220}
            height={220}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* Eyebrow */}
        <p className="mt-10 text-xs uppercase tracking-[0.22em] text-gold">
          Something delicious is on the way
        </p>

        {/* Heading */}
        <h1 className="mt-4 font-heading text-5xl leading-tight text-sage sm:text-6xl">
          We&rsquo;re almost ready to serve.
        </h1>

        {/* Body */}
        <p className="mt-6 text-base leading-8 text-ink/68">
          The Social Spread Cart is putting the finishing touches on our online
          home. In the meantime, reach out directly — we&rsquo;d love to chat
          about your next event.
        </p>

        {/* Contact pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-ink/70">
          <div className="flex items-center gap-2 rounded-full border border-sage/20 bg-white/60 px-5 py-2.5 shadow-soft backdrop-blur-sm">
            <MapPin className="h-4 w-4 text-sage" />
            {siteConfig.location}
          </div>
          <a
            href={`mailto:${siteConfig.email}`}
            className="flex items-center gap-2 rounded-full border border-sage/20 bg-white/60 px-5 py-2.5 shadow-soft backdrop-blur-sm transition hover:border-sage/40 hover:bg-white"
          >
            <Mail className="h-4 w-4 text-sage" />
            {siteConfig.email}
          </a>
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-sage/20 bg-white/60 px-5 py-2.5 shadow-soft backdrop-blur-sm transition hover:border-sage/40 hover:bg-white"
          >
            <AtSign className="h-4 w-4 text-sage" />
            @thesocialspreadcart
          </a>
        </div>

        {/* Divider */}
        <div className="mt-12 h-px w-24 bg-gold/40" />

        {/* Fine print */}
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-ink/40">
          © The Social Spread Cart · Bentonville, AR
        </p>
      </div>

      {/* Stripe bar bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2.5 bg-stripe opacity-90" />
    </div>
  );
}
