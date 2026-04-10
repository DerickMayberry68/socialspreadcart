"use client";

import * as React from "react";
import Link from "next/link";
import Calendar from "react-calendar";
import { isSameDay } from "date-fns";
import { MapPin } from "lucide-react";

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
      <Card className="calendar-shell p-5 sm:p-7">
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
          <Card className="p-8 sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              No Public Events Yet
            </p>
            <h3 className="mt-3 font-heading text-4xl text-sage">
              The next cart pop-up hasn&apos;t been posted yet.
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
            <Card key={event.id} className="overflow-hidden p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="rounded-full bg-sage px-4 py-2 text-xs uppercase tracking-[0.2em] text-cream">
                  {formatLongDate(event.date)}
                </div>
                <div>
                  <h3 className="font-heading text-3xl text-sage">{event.title}</h3>
                  <div className="mt-2 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-gold">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                  <p className="mt-4 text-base leading-7 text-ink/68">
                    {event.description}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
