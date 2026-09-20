import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/origin";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  const error = typeof sp.error === "string" ? sp.error : undefined;
  return <LoginForm next={next} initialError={error} />;
}
