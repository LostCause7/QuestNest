import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicCallbackOrigin, safeNext } from "@/lib/origin";

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
type EmailOtpType = (typeof OTP_TYPES)[number];

/**
 * Handles the PKCE code exchange for OAuth sign-in, email confirmation links
 * and password reset links, then forwards to `next`.
 *
 * Confirmation emails hit Supabase first, which verifies the address, then
 * redirects here with a one-time `code`. Gmail/iCloud often prefetch that
 * link, so the code is already spent when the parent taps it — the account
 * is confirmed, they just need to sign in.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = publicCallbackOrigin(request);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
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

  const supabase = await createClient().catch(() => null);

  if (supabase && tokenHash && authType && (OTP_TYPES as readonly string[]).includes(authType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: authType as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) return redirectAfterAuth(supabase, origin, next);
  }

  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectAfterAuth(supabase, origin, next);

    // Code already used (mail scanner) or PKCE cookie missing (other device).
    // Email is typically already confirmed — send them to sign in.
    if (next === "/reset-password") {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("That reset link has expired. Request a new one.")}`
      );
    }
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent("Your email is confirmed. Sign in to open your nest.")}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("That link is invalid or has expired. Please try again.")}`
  );
}

async function redirectAfterAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  next: string
) {
  let dest = next;
  if (dest !== "/reset-password") {
    const { data: family } = await supabase.from("families").select("id").limit(1).maybeSingle();
    if (!family) dest = "/onboarding";
  }
  return NextResponse.redirect(`${origin}${dest}`);
}
