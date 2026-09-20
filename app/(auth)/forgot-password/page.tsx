import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage(props: PageProps<"/forgot-password">) {
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  return <ForgotPasswordForm initialError={error} />;
}
