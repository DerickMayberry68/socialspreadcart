import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COMING_SOON = process.env.NEXT_PUBLIC_COMING_SOON === "true";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ----------------------------------------------------------
  // Admin auth guard
  // ----------------------------------------------------------
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      // Supabase not configured — block admin entirely
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    let response = NextResponse.next({ request });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ----------------------------------------------------------
  // Coming soon redirect
  // ----------------------------------------------------------
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
