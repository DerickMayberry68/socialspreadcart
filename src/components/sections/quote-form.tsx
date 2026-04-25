"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CheckCircle2, Sparkles } from "lucide-react";
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
import { DEFAULT_CONTACT_PAGE_MARKETING_CONTENT } from "@/lib/page-content-defaults";
import { serviceDescriptions } from "@/lib/site";
import type { ContactPageMarketingContent } from "@/lib/types/site-content";
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

export function QuoteForm({
  content = DEFAULT_CONTACT_PAGE_MARKETING_CONTENT.quote_form,
}: {
  content?: ContactPageMarketingContent["quote_form"];
}) {
  const [form, setForm] = React.useState<FormState>(initialState);
  const [touched, setTouched] = React.useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const errors = validate(form);
  const showError = (field: keyof FormState) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

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
      <Card className="rounded-[36px] border-[#e4dbc9] bg-[#fffaf4] p-8 text-center sm:p-12">
        <div className="mx-auto w-28">
          <Logo variant="circle" />
        </div>
        <CheckCircle2 className="mx-auto mt-6 h-10 w-10 text-sage" />
        <h3 className="mt-6 font-heading text-4xl text-[#284237]">
          {content.success_title}
        </h3>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-ink/70">
          {content.success_body}
        </p>
        <Button className="mt-8" onClick={() => setSuccess(false)}>
          {content.success_button_label}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="rounded-[36px] border-[#e4dbc9] bg-[#fffaf4] p-6 sm:p-8 lg:p-10">
      <div className="mb-8 grid gap-4 rounded-[28px] border border-[#e5dccd] bg-white px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#ad7a54]">
            {content.header_eyebrow}
          </p>
          <h3 className="mt-2 font-heading text-3xl text-[#284237]">
            {content.header_title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-ink/64">
            {content.header_description}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#eef4e9] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#4f684d]">
          <Sparkles className="h-4 w-4" />
          {content.header_badge}
        </div>
      </div>

      <form id="quote-form" className="grid gap-6" onSubmit={submit} noValidate>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{content.name_label}</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              onBlur={() => touch("name")}
              aria-invalid={!!showError("name")}
            />
            {showError("name") && <p className="text-xs text-red-600">{showError("name")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{content.email_label}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              onBlur={() => touch("email")}
              aria-invalid={!!showError("email")}
            />
            {showError("email") && <p className="text-xs text-red-600">{showError("email")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{content.phone_label}</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={updateField}
              onBlur={() => touch("phone")}
              aria-invalid={!!showError("phone")}
            />
            {showError("phone") && <p className="text-xs text-red-600">{showError("phone")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">{content.event_date_label}</Label>
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

          <div className="space-y-2">
            <Label htmlFor="eventType">{content.event_type_label}</Label>
            <Select
              value={form.eventType}
              onValueChange={(value) => {
                setForm((current) => ({ ...current, eventType: value as EventType }));
                touch("eventType");
              }}
            >
              <SelectTrigger id="eventType" aria-invalid={!!showError("eventType")} className="w-full" />
              <SelectValue placeholder={content.event_type_placeholder} />
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

          <div className="space-y-2">
            <Label htmlFor="guests">{content.guests_label}</Label>
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
            {showError("guests") && <p className="text-xs text-red-600">{showError("guests")}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <Label>{content.services_label}</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-sage/15 bg-white px-4 py-4 text-sm transition hover:border-sage/30"
              >
                <Checkbox
                  className="mt-0.5 shrink-0"
                  checked={form.services.includes(option)}
                  onCheckedChange={() => toggleService(option)}
                />
                <div>
                  <p className="font-medium text-ink/80">{option}</p>
                  <p className="mt-1 text-xs leading-6 text-ink/52">
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

        <div className="space-y-2">
          <Label htmlFor="message">
            {content.message_label}{" "}
            <span className="text-ink/40">{content.message_optional_label}</span>
          </Label>
          <Textarea
            id="message"
            name="message"
            value={form.message}
            onChange={updateField}
            placeholder={content.message_placeholder}
          />
        </div>

        <Button size="lg" type="submit" disabled={submitting}>
          {submitting ? content.submitting_label : content.submit_label}
        </Button>
      </form>
    </Card>
  );
}
