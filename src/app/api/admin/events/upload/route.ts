import { NextResponse } from "next/server";

import {
  getSupabaseServiceRoleClient,
  SUPABASE_SERVICE_ROLE_MISSING_MESSAGE,
} from "@/lib/supabase/service";
import { getSupabaseUser } from "@/lib/supabase/server";
import { getCurrentTenant } from "@/lib/tenant";
import { slugify } from "@/lib/utils";

const EVENT_IMAGE_BUCKET = "boards";

function getFileExtension(fileName: string) {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() ?? "jpg" : "jpg";
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "type" in value
  );
}

export async function POST(request: Request) {
  const user = await getSupabaseUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: SUPABASE_SERVICE_ROLE_MISSING_MESSAGE },
      { status: 500 },
    );
  }

  const tenant = await getCurrentTenant();
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") ?? null;

  if (!isUploadedFile(file)) {
    return NextResponse.json(
      { ok: false, message: "Please choose an image file." },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, message: "Only image files can be uploaded." },
      { status: 400 },
    );
  }

  const extension = getFileExtension(file.name);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const path = `${tenant.id}/events/${Date.now()}-${slugify(baseName || "event-image")}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(EVENT_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 400 },
    );
  }

  const { data } = supabase.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(path);

  return NextResponse.json({
    ok: true,
    imageUrl: data.publicUrl,
    path,
  });
}
