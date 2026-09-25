import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ExitClient } from "@/components/kid/exit-client";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { requireFamily } from "@/lib/data/family";
import { getOwnerParentLook } from "@/lib/data/active-parent";
import { hasParentPin } from "@/lib/data/parent";
import { safeNext } from "@/lib/origin";

export const metadata: Metadata = { title: "Parent unlock" };

export default async function ParentUnlockPage(props: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/app");
  const family = await requireFamily();
  const [pinSet, owner] = await Promise.all([hasParentPin(family.id), getOwnerParentLook()]);
  const first = owner.name.split(" ")[0] || owner.name;
  const avatarKey = owner.avatarKey;
  const colorKey = owner.colorKey;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center px-6 py-5">
        <Link
          href="/kids"
          className="qn-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
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
              <KidAvatar avatar={avatarKey} color={colorKey} size="xl" className="shadow-xl" />
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
