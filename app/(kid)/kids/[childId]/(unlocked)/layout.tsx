import Link from "next/link";
import { LockIcon, UsersIcon } from "lucide-react";
import { KidHeader } from "@/components/kid/kid-header";
import { KidTabs } from "@/components/kid/kid-tabs";
import { KidRealtime } from "@/components/kid/kid-realtime";
import { KidDeviceChrome } from "@/components/kid/device-chrome";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild } from "@/lib/data/kid";
import { switchChild } from "@/lib/actions/kid-mode";

export default async function KidShellLayout({ children, params }: LayoutProps<"/kids/[childId]">) {
  const { childId } = await params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);

  return (
    <div className="flex min-h-screen flex-col pb-24 sm:pb-8">
      <KidDeviceChrome />
      <KidRealtime childId={child.id} familyId={family.id} />
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-3 text-xs sm:px-6">
        <form action={switchChild} className="sm:hidden">
          <button type="submit" className="inline-flex items-center gap-1 rounded-full bg-card/70 px-3 py-1.5 font-medium text-muted-foreground shadow-sm">
            <UsersIcon className="size-3.5" />
            Switch profile
          </button>
        </form>
        <span className="hidden sm:block" />
        <Link href="/kids/parent" className="inline-flex items-center gap-1 rounded-full bg-card/70 px-3 py-1.5 font-medium text-muted-foreground shadow-sm hover:text-foreground">
          <LockIcon className="size-3.5" />
          Parents
        </Link>
      </div>
      <KidHeader child={child} family={family} />
      <div className="mx-auto mt-4 w-full max-w-3xl sm:mt-6">
        <KidTabs childId={child.id} />
      </div>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 sm:px-6">{children}</main>
    </div>
  );
}
