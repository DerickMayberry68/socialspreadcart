"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import type { Testimonial } from "@/lib/types";

export function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (testimonials.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <div>
      <Card className="overflow-hidden p-8 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonials[index].id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <p className="font-heading text-3xl leading-tight text-sage sm:text-4xl">
              “{testimonials[index].quote}”
            </p>
            <div className="mt-6 text-sm uppercase tracking-[0.2em] text-ink/60">
              {testimonials[index].name} · {testimonials[index].occasion}
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
      <div className="mt-5 flex gap-2">
        {testimonials.map((testimonial, itemIndex) => (
          <button
            key={testimonial.id}
            type="button"
            aria-label={`Show testimonial ${itemIndex + 1}`}
            className={`h-2.5 w-10 rounded-full transition ${
              itemIndex === index ? "bg-sage" : "bg-sage/20"
            }`}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </div>
  );
}

