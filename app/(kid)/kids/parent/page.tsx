import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ShieldIcon } from "lucide-react";
import { ExitClient } from "@/components/kid/exit-client";
import { requireFamily, requireUser } from "@/lib/data/family";
import { hasParentPin } from "@/lib/data/parent";
import { safeNext } from "@/lib/origin";

export const metadata: Metadata = { title: "Parent unlock" };

export default async function ParentUnlockPage(props: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/app");
  const user = await requireUser();
  const family = await requireFamily();
  const pinSet = await hasParentPin(family.id);
  const first = user.email?.split("@")[0] ?? "Parent";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center px-6 py-5">
        <Link
          href="/kids"
          className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to profiles
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <ExitClient
          next={next}
          hasPin={pinSet}
          header={
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-20 items-center justify-center rounded-3xl bg-nest-gradient text-white shadow-xl">
                <ShieldIcon className="size-9" />
              </span>
              <h1 className="font-display text-3xl font-semibold">Hi, {first}</h1>
              <p className="max-w-xs text-muted-foreground">
                {pinSet
                  ? "Enter the parent PIN to open Parent HQ. Kids stay on their own profiles."
                  : "No parent PIN is set yet, so this device can open Parent HQ. Add a PIN in Settings so kids can't wander in."}
              </p>
            </div>
          }
        />
      </main>
    </div>
  );
}
