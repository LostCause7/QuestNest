import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/auth-form";
import { getClaims } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const claims = await getClaims();
  if (!claims) redirect("/forgot-password?error=" + encodeURIComponent("That reset link has expired. Request a new one."));
  return <ResetPasswordForm />;
}
