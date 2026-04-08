"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { serviceOptions } from "@/lib/site";

const initialState = {
  name: "",
  email: "",
  phone: "",
  eventDate: "",
  eventType: "",
  guests: "",
  services: [] as string[],
  message: "",
};

export function QuoteForm() {
  const [form, setForm] = React.useState(initialState);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const toggleService = (value: string) => {
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
    setSubmitting(true);

    React.startTransition(async () => {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      toast.success("Your quote request has been received.");
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
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-ink/68">
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
      <form id="quote-form" className="grid gap-6" onSubmit={submit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required value={form.name} onChange={updateField} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required value={form.email} onChange={updateField} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required value={form.phone} onChange={updateField} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input id="eventDate" name="eventDate" type="date" required value={form.eventDate} onChange={updateField} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Input id="eventType" name="eventType" required value={form.eventType} onChange={updateField} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Input id="guests" name="guests" required value={form.guests} onChange={updateField} />
          </div>
        </div>
        <div className="space-y-3">
          <Label>Services Needed</Label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-[24px] border border-sage/15 bg-white px-4 py-3 text-sm text-ink/80"
              >
                <Checkbox
                  checked={form.services.includes(option)}
                  onCheckedChange={() => toggleService(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            value={form.message}
            onChange={updateField}
            placeholder="Tell us about your venue, timing, preferred services, and anything we should know about the event."
          />
        </div>
        <Button size="lg" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Request My Quote"}
        </Button>
      </form>
    </Card>
  );
}
