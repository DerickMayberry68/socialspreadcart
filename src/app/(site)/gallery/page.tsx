import type { Metadata } from "next";
import Image from "next/image";

import { Reveal } from "@/components/shared/reveal";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
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
          title="A gallery built around real cart service, drinks, and snack moments."
          description="This page now leans on actual client photography so the site feels grounded in the real offering, not just the branding system."
        />
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
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">
                    {item.eyebrow}
                  </p>
                  <p className="mt-2 font-heading text-2xl text-sage">{item.title}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
