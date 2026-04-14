"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

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

const cardBands = [
  "from-[#f4e5d3] to-[#faf2e8]",
  "from-[#dfe8d8] to-[#f2f7ef]",
  "from-[#f7d8c8] to-[#fff1eb]",
];

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
    <div className="mt-10 grid gap-10 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">Browse with confidence</p>
          <h3 className="mt-2 font-heading text-3xl text-[#284237]">Find the right fit</h3>
          <p className="mt-3 text-sm leading-7 text-ink/62">
            Filter by size, dietary notes, and occasion so the menu feels easy to scan instead of overwhelming.
          </p>
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
              <p className="text-sm uppercase tracking-[0.18em] text-[#4f684d]">
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
                        ? "border-[#284237] bg-[#284237] text-[#fbf5eb]"
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

        <div className="mt-8 rounded-[24px] border border-[#e5dccd] bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#5f7657]" />
            <p className="text-sm leading-7 text-ink/66">
              Most menu favorites need 24 to 48 hours of notice.
            </p>
          </div>
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
        {filtered.length === 0 ? (
          <Card className="rounded-[34px] border-[#e4dbc9] bg-[#fffaf4] p-8 md:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">No matches yet</p>
            <h3 className="mt-3 font-heading text-4xl text-[#284237]">
              No menu items fit those filters.
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/66">
              Try clearing one of the filters to browse the full menu again, or reach out if
              you want something custom for your event.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setFilters(defaultFilters)}>Show Full Menu</Button>
              <Button variant="outline" asChild>
                <Link href="/contact#quote-form">Ask for Something Custom</Link>
              </Button>
            </div>
          </Card>
        ) : (
          filtered.map((item, index) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-[34px] border border-sage/10 bg-white shadow-soft"
            >
              <div className={`bg-gradient-to-br p-4 ${cardBands[index % cardBands.length]}`}>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-ink/48">
                  <span>{item.size}</span>
                  <span>{formatPrice(item.price_cents)}</span>
                </div>
                <div className="mt-4 overflow-hidden rounded-[24px]">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={800}
                    height={920}
                    className="aspect-[4/4.8] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#ad7a54]">
                      {item.occasion[0] ?? "Menu favorite"}
                    </p>
                    <h3 className="mt-2 font-heading text-3xl text-[#284237]">
                      {item.name}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-base leading-7 text-ink/68">
                  {item.description}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/50">
                  Lead time: {item.lead_time}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.dietary.map((value) => (
                    <Badge
                      key={value}
                      className="border-[#ddd5c8] bg-[#fffaf4] text-[#5a6d57]"
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  <Button className="w-full" asChild>
                    <Link href="/contact#quote-form">Add to Quote</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/contact#quote-form">
                      Ask About This
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
