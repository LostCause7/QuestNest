import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { ExtraParentPinClient } from "@/components/kid/extra-parent-pin-client";
import { requireFamily } from "@/lib/data/family";
import { getParentProfiles } from "@/lib/data/parent";
import { consumePinDraft } from "@/lib/pin-draft";

export const metadata: Metadata = { title: "Enter your PIN" };

export default async function ExtraParentPinPage(props: { params: Promise<{ parentId: string }> }) {
  const { parentId } = await props.params;
  const family = await requireFamily();
  const parents = await getParentProfiles(family.id);
  const parent = parents.find((p) => p.id === parentId);
  if (!parent) redirect("/kids");
  const { draft, error } = await consumePinDraft("extra", parent.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center px-6 py-5">
        <Link
          href="/kids"
          className="qn-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Not you?
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <ExtraParentPinClient
          parentId={parent.id}
          draft={draft}
          error={error}
          header={
            <div className="flex flex-col items-center gap-3">
              <KidAvatar
                avatar={parent.avatar}
                color={parent.color}
                size="xl"
                className="shadow-xl ring-4 ring-white animate-float"
              />
              <h1 className="font-display text-3xl font-semibold">Hi {parent.name}!</h1>
              <p className="text-muted-foreground">Enter your parent PIN</p>
            </div>
          }
        />
      </main>
    </div>
  );
}
