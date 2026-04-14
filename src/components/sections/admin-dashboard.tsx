"use client";

import * as React from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EventItem, MenuItem } from "@/lib/types";

export function AdminDashboard({
  initialMenuItems,
  initialEvents,
}: {
  initialMenuItems: MenuItem[];
  initialEvents: EventItem[];
}) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [session, setSession] = React.useState(false);
  const [menuItems, setMenuItems] = React.useState(initialMenuItems);
  const [events, setEvents] = React.useState(initialEvents);
  const [credentials, setCredentials] = React.useState({ email: "", password: "" });
  const [menuForm, setMenuForm] = React.useState({
    name: "",
    description: "",
    price_cents: "",
    size: "",
    dietary: "",
    occasion: "",
    lead_time: "",
    image_url: "",
    featured: "false",
  });
  const [eventForm, setEventForm] = React.useState({
    title: "",
    date: "",
    location: "",
    description: "",
    image_url: "",
  });

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(Boolean(data.session));
      setLoading(false);
    });
  }, [supabase]);

  if (!supabase) {
    return (
      <Card className="p-8">
        <h3 className="font-heading text-3xl text-sage">Supabase not connected</h3>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
          Connect your Supabase environment variables to enable admin sign-in and
          in-browser content editing. Until then, fallback seed content keeps the
          site presentable.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="flex items-center gap-3 p-8 text-sage">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading admin session...
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="max-w-xl p-8">
        <h3 className="font-heading text-4xl text-sage">Admin sign in</h3>
        <p className="mt-4 text-base leading-7 text-ink/68">
          Use a Supabase Auth user with write access under the included RLS
          policies to manage menu items and events.
        </p>
        <form
          className="mt-8 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const { error } = await supabase.auth.signInWithPassword(credentials);

            if (error) {
              toast.error(error.message);
              return;
            }

            setSession(true);
            toast.success("Signed in");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={credentials.email}
              onChange={(event) =>
                setCredentials((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </div>
          <Button type="submit">Sign In</Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            setSession(false);
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-heading text-3xl text-sage">Add menu item</h3>
          <form
            className="mt-6 grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const payload = {
                ...menuForm,
                id: crypto.randomUUID(),
                slug: menuForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                price_cents: Number(menuForm.price_cents),
                dietary: menuForm.dietary.split(",").map((item) => item.trim()).filter(Boolean),
                occasion: menuForm.occasion.split(",").map((item) => item.trim()).filter(Boolean),
                featured: menuForm.featured === "true",
              };

              const response = await fetch("/api/admin/menu-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const result = (await response.json()) as {
                ok: boolean;
                item?: MenuItem;
                message?: string;
              };

              if (!response.ok || !result.ok || !result.item) {
                toast.error(result.message ?? "Failed to add menu item.");
                return;
              }

              const item = result.item;
              setMenuItems((current) => [...current, item]);
              setMenuForm({
                name: "",
                description: "",
                price_cents: "",
                size: "",
                dietary: "",
                occasion: "",
                lead_time: "",
                image_url: "",
                featured: "false",
              });
              toast.success("Menu item added");
            }}
          >
            {[
              ["Name", "name"],
              ["Price (cents)", "price_cents"],
              ["Size", "size"],
              ["Lead Time", "lead_time"],
              ["Image URL", "image_url"],
              ["Dietary (comma separated)", "dietary"],
              ["Occasions (comma separated)", "occasion"],
              ["Featured? true/false", "featured"],
            ].map(([label, key]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={menuForm[key as keyof typeof menuForm]}
                  onChange={(event) =>
                    setMenuForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="menu-description">Description</Label>
              <Textarea
                id="menu-description"
                value={menuForm.description}
                onChange={(event) =>
                  setMenuForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <Button type="submit">Save Menu Item</Button>
          </form>
        </Card>
        <Card className="p-6">
          <h3 className="font-heading text-3xl text-sage">Add event</h3>
          <form
            className="mt-6 grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const payload = {
                ...eventForm,
                id: crypto.randomUUID(),
              };

              const response = await fetch("/api/admin/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const result = (await response.json()) as {
                ok: boolean;
                event?: EventItem;
                message?: string;
              };

              if (!response.ok || !result.ok || !result.event) {
                toast.error(result.message ?? "Failed to add event.");
                return;
              }

              const createdEvent = result.event;
              setEvents((current) => [...current, createdEvent]);
              setEventForm({
                title: "",
                date: "",
                location: "",
                description: "",
                image_url: "",
              });
              toast.success("Event added");
            }}
          >
            {[
              ["Title", "title"],
              ["Date", "date"],
              ["Location", "location"],
              ["Image URL", "image_url"],
            ].map(([label, key]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={key === "date" ? "datetime-local" : "text"}
                  value={eventForm[key as keyof typeof eventForm]}
                  onChange={(event) =>
                    setEventForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(event) =>
                  setEventForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <Button type="submit">Save Event</Button>
          </form>
        </Card>
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-heading text-3xl text-sage">Current menu items</h3>
          <div className="mt-4 space-y-3">
            {menuItems.map((item) => (
              <div key={item.id} className="rounded-3xl border border-sage/10 bg-white px-4 py-3">
                <p className="font-medium text-sage">{item.name}</p>
                <p className="text-sm text-ink/60">
                  {item.size} · {item.lead_time}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-heading text-3xl text-sage">Current events</h3>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-3xl border border-sage/10 bg-white px-4 py-3">
                <p className="font-medium text-sage">{event.title}</p>
                <p className="text-sm text-ink/60">{event.location}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
