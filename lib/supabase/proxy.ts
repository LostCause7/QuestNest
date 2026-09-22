import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = ["/app", "/kids", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];
/** Routes a kid must not reach while Kid Mode is on (they need the parent PIN first). */
const PARENT_ONLY_PREFIXES = ["/app", "/onboarding"];

export const KID_MODE_COOKIE = "qn_kid_mode";
export const ACTIVE_CHILD_COOKIE = "qn_active_child";

/**
 * Refreshes the Supabase session cookie on every matched request and applies
 * optimistic redirects (unauthenticated -> /login, authenticated -> /app).
 * Page-level code still re-verifies with getClaims().
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabaseEnv();
  if (!env) return supabaseResponse;

  let isAuthed = false;
  try {
    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    isAuthed = Boolean(data?.claims);
  } catch {
    return supabaseResponse;
  }
  const { pathname } = request.nextUrl;

  const wantsProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isAuthed && wantsProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  if (isAuthed && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  // Kid Mode lock: once a device is in Kid Mode, parent-only routes bounce to the exit PIN pad.
  const inKidMode = request.cookies.get(KID_MODE_COOKIE)?.value === "1";
  const wantsParentOnly = PARENT_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAuthed && inKidMode && wantsParentOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/kids/exit";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  // Entering any /kids route turns Kid Mode on for this device.
  if (isAuthed && pathname.startsWith("/kids") && pathname !== "/kids/exit" && !inKidMode) {
    supabaseResponse.cookies.set(KID_MODE_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return supabaseResponse;
}

function withCookies(target: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}
