"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Calendar from "react-calendar";
import { isSameDay } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/lib/types";
import { formatLongDate } from "@/lib/utils";

type CalendarValue = Date | null | [Date | null, Date | null];

export function EventsCalendar({ events }: { events: EventItem[] }) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    new Date(events[0]?.date ?? new Date()),
  );

  const eventDates = React.useMemo(
    () => events.map((event) => new Date(event.date)),
    [events],
  );

  const selectedEvents = events.filter((event) =>
    isSameDay(new Date(event.date), selectedDate),
  );
  const visibleEvents = selectedEvents.length ? selectedEvents : events;

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      <Card className="calendar-shell rounded-[34px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-5 shadow-[0_24px_60px_rgba(56,66,44,0.2)] backdrop-blur-xl sm:p-7">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">Calendar view</p>
          <h3 className="mt-2 font-heading text-3xl text-[#284237]">Plan around the cart</h3>
        </div>
        <Calendar
          onChange={(value: CalendarValue) => {
            if (value instanceof Date) {
              setSelectedDate(value);
            }
          }}
          value={selectedDate}
          tileContent={({ date, view }) =>
            view === "month" &&
            eventDates.some((eventDate) => isSameDay(eventDate, date)) ? (
              <div className="mt-1 flex justify-center">
                <span className="event-dot" />
              </div>
            ) : null
          }
        />
      </Card>

      <div className="space-y-4">
        {visibleEvents.length === 0 ? (
          <Card className="rounded-[34px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 p-8 shadow-[0_24px_60px_rgba(56,66,44,0.2)] backdrop-blur-xl sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#ad7a54]">
              No Public Events Yet
            </p>
            <h3 className="mt-3 font-heading text-4xl text-[#284237]">
              The next cart pop-up has not been posted yet.
            </h3>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink/68">
              Check back soon for upcoming public events, or reach out directly
              if you want to book the cart for a private event, school function,
              shower, or corporate gathering.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/contact">Ask About Booking</Link>
            </Button>
          </Card>
        ) : (
          visibleEvents.map((event) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-[32px] border border-sage/25 bg-gradient-to-br from-white/70 via-[#f8f1e3]/58 to-[#dfe8d8]/62 shadow-[0_24px_60px_rgba(56,66,44,0.2)] backdrop-blur-xl"
            >
              <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                {event.image_url ? (
                  <div className="relative min-h-56 overflow-hidden bg-[#f6efe3] md:min-h-full">
                    <Image
                      src={event.image_url}
                      alt={event.title}
                      fill
                      sizes="(min-width: 768px) 220px, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-32 items-center justify-center bg-[#284237] p-5 text-center text-[#fbf5eb] md:min-h-full">
                    <div>
                      <CalendarDays className="mx-auto h-6 w-6" />
                      <p className="mt-3 text-xs font-semibold uppercase leading-5 tracking-[0.14em]">
                        {formatLongDate(event.date)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex-1 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#ad7a54]">
                        {formatLongDate(event.date)}
                      </p>
                      <h3 className="mt-2 font-heading text-3xl text-[#284237]">
                        {event.title}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-ink/55">
                    <MapPin className="h-4 w-4 text-[#4f684d]" />
                    {event.location}
                  </div>
                  <p className="mt-4 text-base leading-7 text-ink/68">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
