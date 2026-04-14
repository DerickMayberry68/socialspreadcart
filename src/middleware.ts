import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ACTIVE_TENANT_COOKIE,
  clearActiveTenantIdOnResponse,
  getLegacyTenantSlug,
  resolveTenantFromHost,
  TenantResolutionError,
} from "@/lib/tenant";
import { getSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { TenantService, type TenantQueryClient } from "@/services/tenant-service";

const COMING_SOON = process.env.NEXT_PUBLIC_COMING_SOON === "true";
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "socialspreadcart.com";

const SKIP_TENANT_RESOLUTION = [
  "/_next/",
  "/favicon.ico",
  "/brand/",
  "/api/auth/",
  "/admin/login",
  "/login",
  "/choose-tenant",
  "/accept-invite",
  "/awaiting-invitation",
  "/robots.txt",
  "/sitemap.xml",
];

function shouldSkipResolution(pathname: string): boolean {
  return SKIP_TENANT_RESOLUTION.some((prefix) => pathname.startsWith(prefix));
}

function isAppHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  return hostname.split(".")[0] === "app";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const { supabase, response } = getSupabaseMiddlewareClient(request);
  const adminPath = pathname.startsWith("/admin");

  if (adminPath && !pathname.startsWith("/admin/login")) {
    if (!supabase) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (COMING_SOON) {
    if (
      pathname.startsWith("/coming-soon") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/brand") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml"
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/coming-soon", request.url));
  }

  if (shouldSkipResolution(pathname)) {
    return response;
  }

  if (!supabase) {
    return response;
  }

  const searchParams = request.nextUrl.searchParams;
  const activeTenantId = request.cookies.get(ACTIVE_TENANT_COOKIE)?.value ?? null;
  const appHost = isAppHost(host);

  if ((appHost || adminPath) && adminPath && !activeTenantId) {
    return NextResponse.redirect(new URL("/choose-tenant", request.url));
  }

  let tenantResult:
    | Awaited<ReturnType<typeof TenantService.getTenantById>>
    | Awaited<ReturnType<typeof resolveTenantFromHost>>;

  if (adminPath && activeTenantId) {
    tenantResult = await TenantService.getTenantById(
      activeTenantId,
      supabase as unknown as TenantQueryClient,
    );

    if (!tenantResult) {
      const redirectResponse = NextResponse.redirect(new URL("/choose-tenant", request.url));
      return clearActiveTenantIdOnResponse(redirectResponse);
    }
  } else {
    tenantResult = await resolveTenantFromHost(
      host,
      supabase as unknown as TenantQueryClient,
      searchParams,
    );
  }

  if (tenantResult instanceof TenantResolutionError) {
    if (
      tenantResult.code === "unknown_slug" &&
      process.env.ENABLE_BARE_DOMAIN_LEGACY === "false"
    ) {
      const redirectUrl = new URL(
        `https://${getLegacyTenantSlug()}.${APP_DOMAIN}${pathname}`,
      );
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    if (tenantResult.code === "suspended" || tenantResult.code === "archived") {
      const notFoundUrl = new URL("/not-found", request.url);
      return NextResponse.rewrite(notFoundUrl, { status: 410 });
    }

    const notFoundUrl = new URL("/not-found", request.url);
    return NextResponse.rewrite(notFoundUrl, { status: 404 });
  }

  if (tenantResult.status === "suspended" || tenantResult.status === "archived") {
    if (adminPath) {
      const redirectResponse = NextResponse.redirect(
        new URL("/awaiting-invitation", request.url),
      );
      return clearActiveTenantIdOnResponse(redirectResponse);
    }

    const notFoundUrl = new URL("/not-found", request.url);
    return NextResponse.rewrite(notFoundUrl, { status: 410 });
  }

  const forwardedUrl = new URL(request.url);
  if (process.env.NODE_ENV === "development") {
    forwardedUrl.searchParams.delete("_tenant");
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenantResult.id);
  requestHeaders.set("x-tenant-slug", tenantResult.slug);

  const shouldRewriteUrl =
    forwardedUrl.pathname !== request.nextUrl.pathname ||
    forwardedUrl.search !== request.nextUrl.search;

  const tenantResponse = shouldRewriteUrl
    ? NextResponse.rewrite(forwardedUrl, {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
  response.cookies.getAll().forEach(({ name, value, ...opts }) => {
    tenantResponse.cookies.set(name, value, opts);
  });
  tenantResponse.headers.set("x-tenant-id", tenantResult.id);
  tenantResponse.headers.set("x-tenant-slug", tenantResult.slug);

  return tenantResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
