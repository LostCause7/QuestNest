import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CANONICAL_ORIGIN, isVercelDeploymentHost } from "@/lib/site-url";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = ["/app", "/kids", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];
/** Routes a kid must not reach while Kid Mode is on (they need the parent PIN first). */
const PARENT_ONLY_PREFIXES = ["/app", "/onboarding"];

export const KID_MODE_COOKIE = "qn_kid_mode";
export const ACTIVE_CHILD_COOKIE = "qn_active_child";

/**
 * Refreshes the Supabase session cookie on every matched request and applies
 * optimistic redirects (unauthenticated -> /login, authenticated -> /kids).
 * Page-level code still re-verifies with getClaims().
 */
export async function updateSession(request: NextRequest) {
  const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  if (process.env.VERCEL_ENV === "production" && isVercelDeploymentHost(requestHost)) {
    const dest = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_ORIGIN);
    if (dest.searchParams.has("code") && dest.pathname !== "/auth/callback") {
      dest.pathname = "/auth/callback";
    }
    return NextResponse.redirect(dest, 308);
  }

  const { pathname } = request.nextUrl;
  // Supabase Site URL fallbacks land on `/` with `?code=`. Finish auth on the nest.
  if (request.nextUrl.searchParams.has("code") && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

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

  // Server Actions POST to the current page. A login/kid-mode redirect here
  // returns HTML and the UI shows "An unexpected response was received from the server."
  const isServerAction =
    request.method !== "GET" &&
    (request.headers.has("next-action") || request.headers.has("Next-Action"));
  if (isServerAction) return supabaseResponse;

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
    url.pathname = "/kids";
    url.search = "";
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  // Kid Mode lock: only after a kid unlocks with their PIN.
  // Visiting the profile picker must not lock Parent HQ behind the parent PIN.
  const inKidMode = request.cookies.get(KID_MODE_COOKIE)?.value === "1";
  const wantsParentOnly = PARENT_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAuthed && inKidMode && wantsParentOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/kids/parent";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return withCookies(NextResponse.redirect(url), supabaseResponse);
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
