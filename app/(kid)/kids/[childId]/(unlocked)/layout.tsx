import Link from "next/link";
import { LockIcon, UsersIcon } from "lucide-react";
import { KidHeader } from "@/components/kid/kid-header";
import { KidTabs } from "@/components/kid/kid-tabs";
import { KidRealtime } from "@/components/kid/kid-realtime";
import { KidDeviceChrome } from "@/components/kid/device-chrome";
import { KidCelebrations } from "@/components/kid/celebration";
import { SoundPackSync } from "@/components/kid/sound-pack-sync";
import { RoomBackdrop } from "@/components/kid/room-backdrop";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild } from "@/lib/data/kid";
import { getChildren } from "@/lib/data/parent";
import { switchChild } from "@/lib/actions/kid-mode";
import { DEFAULT_ROOM, findItem } from "@/lib/cosmetics";

export default async function KidShellLayout({ children, params }: LayoutProps<"/kids/[childId]">) {
  const { childId } = await params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const kids = await getChildren(family.id);
  const siblings = kids.filter((k) => k.id !== child.id).map((k) => ({ id: k.id, name: k.nickname?.trim() || k.name }));

  // Family room overrides a kid's pick when the parent has locked the slot; otherwise kid's choice wins.
  const lockedRoom = family.style?.lockedSlots?.includes("room");
  const roomKey = (lockedRoom ? family.style?.room : child.style?.room) || family.style?.room || DEFAULT_ROOM;
  const room = findItem("room", roomKey)?.key ?? DEFAULT_ROOM;

  return (
    <div className="kid-mode relative flex min-h-dvh flex-col bg-background pb-24 text-foreground" data-room={room}>
      <RoomBackdrop room={room} />
      <KidDeviceChrome />
      <SoundPackSync pack={child.style?.soundPack} room={room} confetti={child.style?.confetti} />
      <KidCelebrations />
      <KidRealtime childId={child.id} familyId={family.id} siblings={siblings} currencyEmoji={family.currency_emoji} />
      <div className="qn-no-print mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-3 text-xs sm:px-6">
        <form action={switchChild}>
          <button type="submit" className="qn-glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-foreground">
            <UsersIcon className="size-3.5" />
            Switch profile
          </button>
        </form>
        <Link href="/kids/parent" className="qn-glass qn-lift inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-foreground">
          <LockIcon className="size-3.5" />
          Parents
        </Link>
      </div>
      <KidHeader child={child} family={family} />
      <div className="qn-no-print mx-auto mt-4 w-full max-w-3xl sm:mt-6">
        <KidTabs childId={child.id} />
      </div>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 sm:px-6">{children}</main>
    </div>
  );
}
