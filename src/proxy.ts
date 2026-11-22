import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_OPTIONS, getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Runs before /student, /parent and /auth routes:
 *  1. refreshes the Supabase session cookie (getClaims validates the JWT),
 *  2. sends signed-out visitors of protected areas to the login page.
 * This is a first gate only. Every page and Server Function checks the user
 * again, and the database enforces access with RLS.
 */
const PROTECTED = ["/student", "/parent"];

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, {
            ...options,
            ...AUTH_COOKIE_OPTIONS,
          });
        }
        for (const [k, v] of Object.entries(headers ?? {})) {
          response.headers.set(k, v);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (
    !signedIn &&
    PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(login);
    // keep any cookie changes (e.g. cleared expired session)
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/student/:path*", "/parent/:path*", "/auth/:path*"],
};
