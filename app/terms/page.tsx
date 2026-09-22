import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-5">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold">Terms</h1>
        <p className="mt-4 text-muted-foreground">
          QuestNest is a chore-and-reward tool for families. You are responsible for the kids on your nest, the
          PINs you set, and the rewards you offer. The service is provided as-is.
        </p>
        <p className="mt-3 text-muted-foreground">
          Don&apos;t use the app to harm anyone. We may remove accounts that abuse the service. Nearby place
          suggestions are public map data and can be wrong — parents decide what actually happens in real life.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Last updated September 2026. This is a short stub — not legal advice.
        </p>
      </main>
    </div>
  );
}
