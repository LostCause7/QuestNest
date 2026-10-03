import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getFamily, requireUser } from "@/lib/data/family";
import { isNextRedirect } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Set up your nest" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  let family = null;
  let loadError: string | null = null;
  try {
    family = await getFamily();
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    loadError = error instanceof Error ? error.message : "Couldn't load your nest.";
  }
  if (family) redirect("/kids");
  if (loadError) {
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
        <main className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold">Your nest is still here</h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t open it just now. Run 0031_tx_kind_text_cast.sql in Supabase, then sign in with the same email. Don&apos;t create a second nest.
          </p>
          <p className="rounded-xl bg-muted px-3 py-2 text-left text-xs text-muted-foreground break-words">{loadError}</p>
        </main>
      </div>
    );
  }

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
