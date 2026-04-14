import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACTIVE_TENANT_COOKIE = "ssc_active_tenant";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
}

export async function setActiveTenantId(tenantId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TENANT_COOKIE, tenantId, COOKIE_OPTIONS);
}

export async function clearActiveTenantId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TENANT_COOKIE);
}

export function setActiveTenantIdOnResponse(
  response: NextResponse,
  tenantId: string,
): NextResponse {
  response.cookies.set(ACTIVE_TENANT_COOKIE, tenantId, COOKIE_OPTIONS);
  return response;
}

export function clearActiveTenantIdOnResponse(
  response: NextResponse,
): NextResponse {
  response.cookies.delete(ACTIVE_TENANT_COOKIE);
  return response;
}
