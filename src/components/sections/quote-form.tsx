"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { serviceDescriptions } from "@/lib/site";
import { EVENT_TYPES, SERVICE_OPTIONS } from "@/types/booking";
import type { EventType, ServiceOption } from "@/types/booking";

type FormState = {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: EventType | "";
  guests: string;
  services: ServiceOption[];
  message: string;
};

type TouchedState = Partial<Record<keyof FormState, boolean>>;

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  eventDate: "",
  eventType: "",
  guests: "",
  services: [],
  message: "",
};

function getMinDate() {
  return format(addDays(new Date(), 2), "yyyy-MM-dd");
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name || form.name.length < 2) errors.name = "Name is required.";
  if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errors.email = "Valid email is required.";
  if (!form.phone || form.phone.length < 7) errors.phone = "Phone number is required.";
  if (!form.eventDate) errors.eventDate = "Please select a date.";
  if (!form.eventType) errors.eventType = "Please select an event type.";
  if (!form.guests) errors.guests = "Guest count is required.";
  if (form.services.length === 0) errors.services = "Please select at least one service.";
  return errors;
}

export function QuoteForm() {
  const [form, setForm] = React.useState<FormState>(initialState);
  const [touched, setTouched] = React.useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const errors = validate(form);
  const showError = (field: keyof FormState) =>
    (touched[field] || submitAttempted) ? errors[field] : undefined;

  const touch = (field: keyof FormState) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const toggleService = (value: ServiceOption) => {
    setTouched((prev) => ({ ...prev, services: true }));
    setForm((current) => ({
      ...current,
      services: current.services.includes(value)
        ? current.services.filter((item) => item !== value)
        : [...current.services, value],
    }));
  };

  const updateField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (Object.keys(validate(form)).length > 0) return;

    setSubmitting(true);

    React.startTransition(async () => {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };
      setSubmitting(false);

      if (!response.ok || !payload.ok) {
        toast.error(payload.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setForm(initialState);
      setTouched({});
      setSubmitAttempted(false);
    });
  };

  if (success) {
    return (
      <Card className="p-8 text-center sm:p-12">
        <div className="mx-auto w-28">
          <Logo variant="circle" />
        </div>
        <CheckCircle2 className="mx-auto mt-6 h-10 w-10 text-sage" />
        <h3 className="mt-6 font-heading text-4xl text-sage">Thank you</h3>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-ink/70">
          We&apos;ve received your inquiry and will follow up with next steps,
          availability, and a tailored quote.
        </p>
        <Button className="mt-8" onClick={() => setSuccess(false)}>
          Submit another inquiry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 lg:p-10">
      <form id="quote-form" className="grid gap-6" onSubmit={submit} noValidate>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              onBlur={() => touch("name")}
              aria-invalid={!!showError("name")}
            />
            {showError("name") && (
              <p className="text-xs text-red-600">{showError("name")}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              onBlur={() => touch("email")}
              aria-invalid={!!showError("email")}
            />
            {showError("email") && (
              <p className="text-xs text-red-600">{showError("email")}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={updateField}
              onBlur={() => touch("phone")}
              aria-invalid={!!showError("phone")}
            />
            {showError("phone") && (
              <p className="text-xs text-red-600">{showError("phone")}</p>
            )}
          </div>

          {/* Event Date */}
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              name="eventDate"
              type="date"
              min={getMinDate()}
              value={form.eventDate}
              onChange={updateField}
              onBlur={() => touch("eventDate")}
              aria-invalid={!!showError("eventDate")}
            />
            {showError("eventDate") && (
              <p className="text-xs text-red-600">{showError("eventDate")}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={form.eventType}
              onValueChange={(value) => {
                setForm((current) => ({ ...current, eventType: value as EventType }));
                touch("eventType");
              }}
            >
              <SelectTrigger
                id="eventType"
                aria-invalid={!!showError("eventType")}
                className="w-full"
              >
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showError("eventType") && (
              <p className="text-xs text-red-600">{showError("eventType")}</p>
            )}
          </div>

          {/* Guest Count */}
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              name="guests"
              type="number"
              min={1}
              value={form.guests}
              onChange={updateField}
              onBlur={() => touch("guests")}
              aria-invalid={!!showError("guests")}
            />
            {showError("guests") && (
              <p className="text-xs text-red-600">{showError("guests")}</p>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="space-y-3">
          <Label>Services Needed</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-sage/15 bg-white px-4 py-3 text-sm transition hover:border-sage/30"
              >
                <Checkbox
                  className="mt-0.5 shrink-0"
                  checked={form.services.includes(option)}
                  onCheckedChange={() => toggleService(option)}
                />
                <div>
                  <p className="font-medium text-ink/80">{option}</p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {serviceDescriptions[option]}
                  </p>
                </div>
              </label>
            ))}
          </div>
          {showError("services") && (
            <p className="text-xs text-red-600">{showError("services")}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message <span className="text-ink/40">(optional)</span></Label>
          <Textarea
            id="message"
            name="message"
            value={form.message}
            onChange={updateField}
            placeholder="Tell us about your venue, timing, and anything we should know."
          />
        </div>

        <Button size="lg" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Request My Quote"}
        </Button>
      </form>
    </Card>
  );
}
