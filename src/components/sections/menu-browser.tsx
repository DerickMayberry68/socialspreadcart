"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

type FilterState = {
  size: string;
  dietary: string;
  occasion: string;
};

const defaultFilters: FilterState = {
  size: "All",
  dietary: "All",
  occasion: "All",
};

export function MenuBrowser({ items }: { items: MenuItem[] }) {
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);

  const sizes = ["All", ...new Set(items.map((item) => item.size))];
  const dietary = ["All", ...new Set(items.flatMap((item) => item.dietary))];
  const occasions = ["All", ...new Set(items.flatMap((item) => item.occasion))];

  const filtered = React.useMemo(() => {
    return items.filter((item) => {
      const sizeMatch = filters.size === "All" || item.size === filters.size;
      const dietMatch =
        filters.dietary === "All" || item.dietary.includes(filters.dietary);
      const occasionMatch =
        filters.occasion === "All" || item.occasion.includes(filters.occasion);

      return sizeMatch && dietMatch && occasionMatch;
    });
  }, [filters, items]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    React.startTransition(() => {
      setFilters((current) => ({ ...current, [key]: value }));
    });
  };

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Filters</p>
          <h3 className="mt-2 font-heading text-3xl text-sage">Find your board</h3>
        </div>
        <div className="mt-6 space-y-6">
          {[
            { label: "Size", value: filters.size, options: sizes, key: "size" as const },
            {
              label: "Dietary",
              value: filters.dietary,
              options: dietary,
              key: "dietary" as const,
            },
            {
              label: "Occasion",
              value: filters.occasion,
              options: occasions,
              key: "occasion" as const,
            },
          ].map((group) => (
            <div key={group.label}>
              <p className="text-sm uppercase tracking-[0.18em] text-sage">
                {group.label}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateFilter(group.key, option)}
                    className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition ${
                      group.value === option
                        ? "border-sage bg-sage text-cream"
                        : "border-sage/15 bg-white text-ink/70 hover:border-sage hover:text-sage"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="mt-8 w-full"
          onClick={() => setFilters(defaultFilters)}
        >
          Reset Filters
        </Button>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-[4/4.6] overflow-hidden">
              <Image
                src={item.image_url}
                alt={item.name}
                width={800}
                height={920}
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">
                    {item.size}
                  </p>
                  <h3 className="mt-2 font-heading text-3xl text-sage">
                    {item.name}
                  </h3>
                </div>
                <p className="text-sm uppercase tracking-[0.18em] text-ink/60">
                  {formatPrice(item.price_cents)}
                </p>
              </div>
              <p className="mt-3 text-base leading-7 text-ink/68">
                {item.description}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/50">
                Lead time: {item.lead_time}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.dietary.map((value) => (
                  <Badge key={value}>{value}</Badge>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <Button className="flex-1" asChild>
                  <Link href={`/contact#quote-form?item=${item.slug}`}>Add to Quote</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/contact#quote-form">Order Now</Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

