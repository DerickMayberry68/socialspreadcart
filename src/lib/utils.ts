import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}

// Postgres `date` columns serialize as a bare `YYYY-MM-DD` string. Passing that
// to `new Date()` parses it as UTC midnight, which renders as the *previous*
// calendar day in negative-offset (e.g. US) timezones. `timestamptz` values
// carry an offset and parse correctly. This helper parses date-only strings as
// local time so a stored calendar date always displays as that same day.
export function parseDbDate(value: string | Date): Date {
  if (value instanceof Date) return value;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  return new Date(value);
}

export function formatAdminDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
) {
  return new Intl.DateTimeFormat("en-US", options).format(parseDbDate(value));
}

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseDbDate(date));
}

export function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseDbDate(date));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// `crypto.randomUUID` is only exposed in secure contexts (HTTPS or localhost).
// When the admin is accessed over a LAN IP or an older browser, it throws.
// This helper uses it when available and falls back to a v4 UUID built from
// `crypto.getRandomValues`, with a final `Math.random` safety net.
export function generateUuid(): string {
  const g = globalThis as typeof globalThis & {
    crypto?: {
      randomUUID?: () => string;
      getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
    };
  };

  if (typeof g.crypto?.randomUUID === "function") {
    try {
      return g.crypto.randomUUID();
    } catch {
      // fall through
    }
  }

  const bytes = new Uint8Array(16);
  if (typeof g.crypto?.getRandomValues === "function") {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hex.push(bytes[i].toString(16).padStart(2, "0"));
  }
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
