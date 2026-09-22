import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { KidPinClient } from "@/components/kid/kid-pin-client";
import { requireFamily } from "@/lib/data/family";
import { getChildren } from "@/lib/data/parent";
import { getActiveChildId } from "@/lib/data/kid";
import { childLook, frameClass } from "@/lib/milestones";

export const metadata: Metadata = { title: "Enter your PIN" };

export default async function KidPinPage(props: PageProps<"/kids/[childId]/pin">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const kids = await getChildren(family.id);
  const kid = kids.find((k) => k.id === childId);
  if (!kid) redirect("/kids");
  if ((await getActiveChildId()) === kid.id) redirect(`/kids/${kid.id}`);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center px-6 py-5">
        <Link href="/kids" className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm hover:text-foreground">
          <ArrowLeftIcon className="size-4" />
          Not you?
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <KidPinClient
          childId={kid.id}
          header={
            <div className="flex flex-col items-center gap-3">
              <KidAvatar
                avatar={kid.avatar}
                color={kid.color}
                size="xl"
                sticker={childLook(kid.style).sticker}
                frameClassName={frameClass(childLook(kid.style).frame)}
                className="shadow-xl animate-float"
              />
              <h1 className="font-display text-3xl font-semibold">Hi {kid.nickname?.trim() || kid.name}!</h1>
              <p className="text-muted-foreground">Enter your secret PIN</p>
            </div>
          }
        />
      </main>
    </div>
  );
}
