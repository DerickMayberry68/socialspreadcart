import type { Metadata } from "next";

import { QuoteForm } from "@/components/sections/quote-form";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote from The Social Spread Cart for charcuterie boards, mobile cart service, and custom catering in Arkansas.",
};

export default function ContactPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Contact + Quotes"
          title="Tell us about your date, guest count, and event vision."
          description="We’ll use your inquiry to build a tailored recommendation for boards, cart service, or a fully custom spread."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="h-fit p-8">
            <h3 className="font-heading text-4xl text-sage">Let’s plan it</h3>
            <div className="mt-6 space-y-4 text-base leading-7 text-ink/68">
              <p>{siteConfig.location}</p>
              <p>{siteConfig.phone}</p>
              <p>{siteConfig.email}</p>
              <p>
                Boards usually require 48 to 72 hours’ notice. Cart service and
                custom event spreads are best booked as early as possible.
              </p>
            </div>
          </Card>
          <QuoteForm />
        </div>
      </SectionShell>
    </div>
  );
}

