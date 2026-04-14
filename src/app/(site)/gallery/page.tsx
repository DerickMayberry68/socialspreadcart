import type { Metadata } from "next";
import Image from "next/image";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { Card } from "@/components/ui/card";
import { getGalleryItems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A gallery of real cart setups, drinks, charcuterie, and event-ready menu moments from The Social Spread Cart.",
};

export default async function GalleryPage() {
  const gallery = await getGalleryItems();

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Gallery"
          title="A visual library of real cart service, drinks, grazing, and event-ready moments."
          description="This page leans on actual client photography so the brand feels grounded in the real offering, not just the aesthetic direction."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-7 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">What the gallery should do</p>
            <p className="mt-4 font-heading text-4xl leading-tight text-[#284237]">
              Make the product feel real, the events feel joyful, and the brand feel worth trusting.
            </p>
          </Card>
          <Card className="rounded-[30px] p-6">
            <p className="text-base leading-7 text-ink/66">
              The goal is not just to show pretty images. It is to help future clients picture what the menu and the cart will feel like in their own event.
            </p>
          </Card>
        </div>

        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {gallery.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.04} className="mb-4 break-inside-avoid">
              <div className="overflow-hidden rounded-[30px] border border-sage/10 bg-white shadow-soft">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  width={800}
                  height={1000}
                  className="h-auto w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#ad7a54]">
                    {item.eyebrow}
                  </p>
                  <p className="mt-2 font-heading text-2xl text-[#284237]">{item.title}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
