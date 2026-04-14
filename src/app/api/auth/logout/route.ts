import { NextResponse } from "next/server";

import { clearActiveTenantIdOnResponse } from "@/lib/tenant";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearActiveTenantIdOnResponse(response);
}
