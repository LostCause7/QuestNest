import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getFamily, requireUser } from "@/lib/data/family";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Set up your nest" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const family = await getFamily();
  if (family) redirect("/kids");

  let first = "";
  if (getSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      first = (profile?.display_name ?? "").split(" ")[0] ?? "";
    } catch {
      first = "";
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
        </form>
      </header>
      <main className="px-4 pb-16 pt-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Let&apos;s build your nest</h1>
          <p className="mt-2 text-muted-foreground">Four quick steps and your kids can start questing.</p>
        </div>
        <OnboardingWizard defaultName={first} />
      </main>
    </div>
  );
}
