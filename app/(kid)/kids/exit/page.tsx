import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ShieldIcon } from "lucide-react";
import { ExitClient } from "@/components/kid/exit-client";
import { requireFamily } from "@/lib/data/family";
import { hasParentPin } from "@/lib/data/parent";
import { safeNext } from "@/lib/origin";

export const metadata: Metadata = { title: "Parents only" };

export default async function ExitKidModePage(props: PageProps<"/kids/exit">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/app");
  const family = await requireFamily();
  const pinSet = await hasParentPin(family.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center px-6 py-5">
        <Link href="/kids" className="qn-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
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
              <span className="qn-chrome flex size-20 items-center justify-center rounded-3xl">
                <ShieldIcon className="size-9" />
              </span>
              <h1 className="font-display text-3xl font-semibold">Parents only</h1>
              <p className="max-w-xs text-muted-foreground">
                {pinSet ? "Enter the parent PIN to leave Kid Mode." : "No parent PIN is set yet, so anyone can leave Kid Mode. You can add one in Settings."}
              </p>
            </div>
          }
        />
      </main>
    </div>
  );
}
