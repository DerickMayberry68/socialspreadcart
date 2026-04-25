import { NextResponse } from "next/server";

import { requireTenantAdmin } from "@/lib/auth/require-tenant-admin";
import { MARKETING_PAGE_KEYS } from "@/lib/page-content-defaults";
import type { MarketingPageKey } from "@/lib/types/site-content";
import {
  getSupabaseServiceRoleClient,
  SUPABASE_SERVICE_ROLE_MISSING_MESSAGE,
} from "@/lib/supabase/service";
import { slugify } from "@/lib/utils";

const MARKETING_IMAGE_BUCKET = "boards";

function getFileExtension(fileName: string) {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() ?? "jpg" : "jpg";
}

function isMarketingPageKey(value: string): value is MarketingPageKey {
  return MARKETING_PAGE_KEYS.includes(value as MarketingPageKey);
}

export async function POST(request: Request) {
  try {
    const guard = await requireTenantAdmin();
    if ("error" in guard) return guard.error;

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, message: SUPABASE_SERVICE_ROLE_MISSING_MESSAGE },
        { status: 500 },
      );
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    const pageKeyRaw = formData?.get("pageKey");

    if (typeof pageKeyRaw !== "string" || !isMarketingPageKey(pageKeyRaw)) {
      return NextResponse.json(
        { ok: false, message: "A valid pageKey is required." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
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
    const path = `${guard.tenant.id}/marketing/${pageKeyRaw}/${Date.now()}-${slugify(
      baseName || "page-image",
    )}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(MARKETING_IMAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 },
      );
    }

    const { data } = supabase.storage
      .from(MARKETING_IMAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ ok: true, imageUrl: data.publicUrl, path });
  } catch (error) {
    console.error("Marketing page image upload failed", error);
    return NextResponse.json(
      { ok: false, message: "Failed to upload image." },
      { status: 500 },
    );
  }
}
