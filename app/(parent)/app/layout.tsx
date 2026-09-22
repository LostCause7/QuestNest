import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayIcon } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SidebarNav, MobileNav } from "@/components/parent/nav";
import { UserMenu } from "@/components/parent/user-menu";
import { ParentRealtime } from "@/components/parent/parent-realtime";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getPendingCompletions, getRedemptions } from "@/lib/data/parent";
import { createClient } from "@/lib/supabase/server";
import { isNextRedirect } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function ParentLayout(props: LayoutProps<"/app">) {
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
  const supabase = await createClient();

  const [{ data: profile }, pendingCompletions, pendingRedemptions] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
    getPendingCompletions(family.id),
    getRedemptions(family.id, ["pending"]),
  ]);
  const pendingCount = pendingCompletions.length + pendingRedemptions.length;
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Parent";

  return (
    <div className="flex min-h-screen">
      <ParentRealtime familyId={family.id} />
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/app">
            <Logo tone="light" size="sm" />
          </Link>
        </div>
        <div className="px-3">
          <div className="mb-4 rounded-2xl bg-sidebar-accent/60 px-4 py-3">
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
              Enter Kid Mode
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
            <LogoMark className="size-4" tone="light" />
            QuestNest
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
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
                Kid Mode
              </Link>
            </Button>
            <UserMenu name={displayName} email={user.email} avatarUrl={profile?.avatar_url ?? null} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
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
