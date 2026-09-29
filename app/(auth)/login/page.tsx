import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const message = typeof sp.message === "string" ? sp.message : undefined;
  return <LoginForm initialError={error} initialMessage={message} />;
}
