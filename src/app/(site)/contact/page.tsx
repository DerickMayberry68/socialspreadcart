import type { Metadata } from "next";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";

import { QuoteForm } from "@/components/sections/quote-form";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote from The Social Spread Cart for charcuterie boxes, cups, dirty soda, mini pancake bar service, bartending, and cart service in NWA.",
};

export default function ContactPage() {
  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Contact and Quotes"
          title="Tell us about the date, guest count, and feeling you want the event to have."
          description="We use your inquiry to recommend the right mix of charcuterie boxes, cups, dirty soda, mini pancake bar service, bartending, or cart service."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-5">
            <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-8">
              <h3 className="font-heading text-4xl text-[#284237]">Let&apos;s plan it</h3>
              <p className="mt-4 text-base leading-7 text-ink/68">
                Smaller menu orders usually require 48 to 72 hours of notice.
                Cart service and larger event bookings are best booked as early
                as possible.
              </p>
            </Card>

            {[
              { icon: MapPin, label: "Location", value: siteConfig.location },
              { icon: Phone, label: "Phone", value: siteConfig.phone },
              { icon: Mail, label: "Email", value: siteConfig.email },
              {
                icon: Clock3,
                label: "What to expect",
                value: "We will follow up with availability, next steps, and the best fit for your event.",
              },
            ].map((item) => (
              <Card key={item.label} className="rounded-[30px] p-6">
                <item.icon className="h-6 w-6 text-[#4f684d]" />
                <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                  {item.label}
                </p>
                <p className="mt-2 text-base leading-7 text-ink/68">{item.value}</p>
              </Card>
            ))}
          </div>

          <QuoteForm />
        </div>
      </SectionShell>
    </div>
  );
}
