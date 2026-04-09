import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getSupabaseUser } from "@/lib/supabase/server";

const eventSchema = z.object({
  title: z.string().min(2),
  date: z.string().min(1),
  location: z.string().min(2),
  description: z.string().min(2),
  image_url: z.string().url().optional().or(z.literal("")),
  join_url: z.string().url().optional().or(z.literal("")),
});

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid fields." }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from("events")
    .insert({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      date: parsed.data.date,
      location: parsed.data.location,
      description: parsed.data.description,
      image_url: parsed.data.image_url || "",
      join_url: parsed.data.join_url || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, event: data });
}

export async function PUT(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ ok: false, message: "Missing id." }, { status: 400 });

  const parsed = eventSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid fields." }, { status: 400 });
  }

  const { data, error } = await serviceClient()
    .from("events")
    .update({
      title: parsed.data.title,
      date: parsed.data.date,
      location: parsed.data.location,
      description: parsed.data.description,
      image_url: parsed.data.image_url || "",
      join_url: parsed.data.join_url || null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, event: data });
}

export async function DELETE(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ ok: false, message: "Missing id." }, { status: 400 });

  const { error } = await serviceClient().from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
