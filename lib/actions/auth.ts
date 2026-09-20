"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrigin, safeNext } from "@/lib/origin";

export type AuthState = { error?: string; message?: string } | undefined;

const credentials = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signInWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Please confirm your email first. Check your inbox for the link."
          : "Incorrect email or password.",
    };
  }
  redirect(safeNext(formData.get("next")?.toString()));
}

export async function signUpWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const schema = credentials.extend({
    name: z.string().trim().min(1, "Tell us your name.").max(60),
  });
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };

  // Email confirmation disabled -> we already have a session.
  if (data.session) redirect("/onboarding");

  // Supabase returns an "obfuscated" user with no identities when the email already exists.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  return {
    message: `We sent a confirmation link to ${parsed.data.email}. Click it to finish creating your nest.`,
  };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const origin = await getOrigin();
  const next = safeNext(formData.get("next")?.toString());
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent("Google sign-in is unavailable right now.")}`);
  redirect(data.url);
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.email("Enter a valid email address.").safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const schema = z
    .object({
      password: z.string().min(8, "Password must be at least 8 characters."),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] });
  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/app?updated=password");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
