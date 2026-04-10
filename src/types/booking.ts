export const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Corporate Event",
  "Private Party",
  "Anniversary",
  "Baby/Bridal Shower",
  "Holiday Party",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const SERVICE_OPTIONS = [
  "Charcuterie Boxes",
  "Charcuterie Cups",
  "Dirty Soda 4-Pack",
  "Charcuterie Cart",
  "Dirty Soda Cart",
  "Mini Pancake Bar",
  "Bartending Service",
  "Ice Cream Toppings Bar",
  "Other",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];
