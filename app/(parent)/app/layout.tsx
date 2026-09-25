import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayIcon } from "lucide-react";
import { ParentShellFallback } from "@/components/parent/manager-fallback";
import { PrefsApplier } from "@/components/parent/nest-extras";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SidebarNav, MobileNav } from "@/components/parent/nav";
import { UserMenu } from "@/components/parent/user-menu";
import { ParentRealtime } from "@/components/parent/parent-realtime";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getActiveParentLook } from "@/lib/data/active-parent";
import { getPendingCompletions, getRedemptions } from "@/lib/data/parent";
import { isNextRedirect } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default function ParentLayout(props: LayoutProps<"/app">) {
  return (
    <Suspense fallback={<ParentShellFallback />}>
      <ParentLayoutGuarded {...props} />
    </Suspense>
  );
}

async function ParentLayoutGuarded(props: LayoutProps<"/app">) {
  try {
    return await ParentLayoutInner(props);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error(error);
    redirect("/login?error=" + encodeURIComponent("We couldn't open Parent HQ. Please sign in again."));
  }
}

async function ParentLayoutInner({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  const family = await requireFamily();

  const [look, pendingCompletions, pendingRedemptions] = await Promise.all([
    getActiveParentLook(family.id),
    getPendingCompletions(family.id),
    getRedemptions(family.id, ["pending"]),
  ]);
  const pendingCount = pendingCompletions.length + pendingRedemptions.length;

  return (
    <div className="flex min-h-screen">
      <PrefsApplier />
      <ParentRealtime familyId={family.id} />
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/20 bg-[linear-gradient(180deg,oklch(0.38_0.04_230),oklch(0.26_0.035_230))] text-sidebar-foreground shadow-[inset_-1px_0_0_rgba(255,255,255,0.08)] md:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/app">
            <Logo tone="light" size="sm" />
          </Link>
        </div>
        <div className="px-3">
          <div className="mb-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
            <div className="text-xs uppercase tracking-wide text-sidebar-foreground/60">Your nest</div>
            <div className="truncate font-medium">{family.name}</div>
            <div className="mt-0.5 text-xs text-sidebar-foreground/70">
              Earning {family.currency_emoji} {family.currency_name}
            </div>
          </div>
          <SidebarNav pendingCount={pendingCount} />
        </div>
        <div className="mt-auto space-y-3 p-4">
          <Button asChild className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" size="lg">
            <Link href="/kids">
              <PlayIcon />
              Switch profile
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
            <LogoMark className="size-4" tone="light" />
            ChoreHall
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="qn-glass-panel sticky top-0 z-30 flex h-14 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/app">
              <Logo size="sm" />
            </Link>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            {formatHeaderDate(family.timezone)}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="md:hidden">
              <Link href="/kids">
                <PlayIcon />
                Profiles
              </Link>
            </Button>
            <UserMenu
              name={look.name}
              email={user.email}
              avatarUrl={look.avatarUrl}
              avatarKey={look.avatarKey}
              colorKey={look.colorKey}
            />
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileNav pendingCount={pendingCount} />
      </div>
    </div>
  );
}

function formatHeaderDate(timeZone: string) {
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" };
  try {
    return new Date().toLocaleDateString(undefined, { ...opts, timeZone });
  } catch {
    return new Date().toLocaleDateString(undefined, opts);
  }
}
