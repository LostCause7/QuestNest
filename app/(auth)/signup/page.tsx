import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create your nest" };

export default function SignupPage() {
  return <SignupForm />;
}
