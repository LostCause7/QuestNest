import type { Metadata } from "next";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ProfilePicker } from "@/components/kid/profile-picker";
import { requireFamily } from "@/lib/data/family";
import { getChildren } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Who's questing?" };

export default async function KidPickerPage() {
  const family = await requireFamily();
  const kids = await getChildren(family.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo size="sm" />
        <Link
          href="/kids/exit"
          className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm hover:text-foreground"
        >
          <LockIcon className="size-3.5" />
          I&apos;m a parent
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <h1 className="font-display text-4xl font-semibold text-balance text-center sm:text-5xl">Who&apos;s questing today?</h1>
        <p className="mt-2 text-center text-lg text-muted-foreground">Tap your avatar to get started.</p>
        <ProfilePicker kids={kids} />
      </main>
    </div>
  );
}
