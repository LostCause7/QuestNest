"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getEmailOrigin } from "@/lib/origin";
import { isNextRedirect } from "@/lib/errors";

export type AuthState = { error?: string; message?: string } | undefined;

const CONFIG_ERROR =
  "ChoreHall could not reach the nest. Check that Supabase is connected, then try again.";

async function supabaseForAuth() {
  if (!getSupabaseEnv()) return null;
  try {
    return await createClient();
  } catch {
    return null;
  }
}

const credentials = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signInWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const parsed = credentials.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const supabase = await supabaseForAuth();
    if (!supabase) return { error: CONFIG_ERROR };

    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return {
        error:
          error.code === "email_not_confirmed"
            ? "Please confirm your email first. Check your inbox for the link."
            : "Incorrect email or password.",
      };
    }
    redirect("/kids");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: CONFIG_ERROR };
  }
}

export async function signUpWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const schema = credentials.extend({
      name: z.string().trim().min(1, "Tell us your name.").max(60),
    });
    const parsed = schema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const supabase = await supabaseForAuth();
    if (!supabase) return { error: CONFIG_ERROR };

    const origin = await getEmailOrigin();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return { error: "An account with this email already exists. Try signing in." };
      }
      if (msg.includes("error sending") || msg.includes("smtp") || msg.includes("confirmation")) {
        return { error: "We created your account, but the confirmation email did not send. Try signing in, or ask a parent to check email settings." };
      }
      return { error: error.message };
    }

    // Email confirmation disabled -> we already have a session.
    if (data.session) redirect("/onboarding");

    // Supabase returns an "obfuscated" user with no identities when the email already exists.
    if (data.user && data.user.identities?.length === 0) {
      return { error: "An account with this email already exists. Try signing in." };
    }

    return {
      message: `We sent a confirmation link to ${parsed.data.email}. Click it to finish creating your nest.`,
    };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: CONFIG_ERROR };
  }
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const parsed = z.email("Enter a valid email address.").safeParse(formData.get("email"));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message };

    const supabase = await supabaseForAuth();
    if (!supabase) return { error: CONFIG_ERROR };

    const origin = await getEmailOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (error) return { error: error.message };
    return { message: "If an account exists for that email, a reset link is on its way." };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: CONFIG_ERROR };
  }
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
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

    const supabase = await supabaseForAuth();
    if (!supabase) return { error: CONFIG_ERROR };
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { error: error.message };
    redirect("/kids");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: CONFIG_ERROR };
  }
}

export async function signOut() {
  try {
    const supabase = await supabaseForAuth();
    if (supabase) await supabase.auth.signOut();
  } catch {
    // Always leave the session page even if sign-out cannot talk to Supabase.
  }
  redirect("/");
}
