import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-5">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold">Privacy</h1>
        <p className="mt-4 text-muted-foreground">
          QuestNest stores your family&apos;s nest — kids, quests, rewards, and a points ledger — in Supabase so it
          works on every device you sign in on. We don&apos;t sell that data. Nearby shop ideas come from
          OpenStreetMap using only the city you type in Settings.
        </p>
        <p className="mt-3 text-muted-foreground">
          You can export a JSON copy of the nest or delete the family from Settings. Signing out leaves the data
          until you delete it.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Last updated September 2026. This is a short stub for a family app — not legal advice.
        </p>
      </main>
    </div>
  );
}
