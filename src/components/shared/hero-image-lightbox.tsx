"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import Image from "next/image";

type HeroImageLightboxProps = {
  src: string;
  alt: string;
  primaryLabel: string;
  secondaryLabel?: string;
};

export function HeroImageLightbox({
  src,
  alt,
  primaryLabel,
  secondaryLabel,
}: HeroImageLightboxProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-[30px] bg-[#f6efe3] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-label={`View full-size image: ${alt}`}
        >
          <div className="absolute left-1/2 top-5 z-10 flex -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-[20px] border border-white/10 bg-[#284237]/75 px-5 py-3.5 shadow-md backdrop-blur-md">
            <span className="whitespace-nowrap text-[11px] font-bold uppercase leading-none tracking-[0.2em] text-[#fefaf0]">
              {primaryLabel}
            </span>
            {secondaryLabel ? (
              <span className="whitespace-nowrap text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] text-[#fefaf0]/80">
                {secondaryLabel}
              </span>
            ) : null}
          </div>
          <Image
            src={src}
            alt={alt}
            width={900}
            height={1100}
            priority
            className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-[#284237]/75 text-white opacity-90 shadow-md backdrop-blur-md transition group-hover:bg-[#284237] group-focus-visible:bg-[#284237]">
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">View full size</span>
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#18241f]/80 backdrop-blur-md" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[min(calc(100vw-2rem),90rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[30px] border border-white/20 bg-[#f7f1e6]/95 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.45)] outline-none sm:p-5">
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Full-size view of the main hero image.
          </Dialog.Description>
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1200}
            sizes="95vw"
            className="max-h-[calc(100vh-4.5rem)] w-auto max-w-full rounded-[22px] object-contain"
          />
          <Dialog.Close
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-[#284237]/90 text-white shadow-lg transition hover:bg-[#182d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#284237]"
            aria-label="Close full-size image"
            title="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
