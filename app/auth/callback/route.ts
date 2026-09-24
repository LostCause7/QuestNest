import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicCallbackOrigin, safeNext } from "@/lib/origin";

/**
 * Handles the PKCE code exchange for OAuth sign-in, email confirmation links
 * and password reset links, then forwards to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = publicCallbackOrigin(request);
  const code = searchParams.get("code");
  const requested = searchParams.get("next");
  const authType = searchParams.get("type");
  let next = "/kids";
  if (requested === "/onboarding") next = "/onboarding";
  else if (requested === "/reset-password" || authType === "recovery") next = "/reset-password";
  else if (requested && !requested.startsWith("/app")) next = safeNext(requested, "/kids");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        let dest = next;
        if (dest !== "/reset-password") {
          const { data: family } = await supabase.from("families").select("id").limit(1).maybeSingle();
          if (!family) dest = "/onboarding";
        }
        return NextResponse.redirect(`${origin}${dest}`);
      }
    } catch {
      // Missing env or exchange failure — send them to sign-in, not a crash page.
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("That link is invalid or has expired. Please try again.")}`
  );
}
