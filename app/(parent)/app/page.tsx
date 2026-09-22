import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SwordsIcon, GiftIcon, UsersIcon, ArrowRightIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/parent/page-header";
import { StatCard } from "@/components/parent/stat-card";
import { ApprovalQueue, type PendingItem } from "@/components/parent/approval-queue";
import { KidSummaryCard } from "@/components/parent/kid-summary-card";
import { ActivityList } from "@/components/parent/activity-list";
import { WelcomeToast } from "@/components/parent/welcome-toast";
import { Chalkboard, FamilyXpBar, FirstWeekCoach, RivalBoard } from "@/components/parent/nest-extras";
import { requireFamily } from "@/lib/data/family";
import {
  getChildren,
  getChores,
  getRewards,
  getPendingCompletions,
  getRedemptions,
  getCompletionsBetween,
  getTransactions,
  familyToday,
  shiftDate,
} from "@/lib/data/parent";
import { isChoreDueOn } from "@/lib/schedule";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/app">) {
  const sp = await props.searchParams;
  const family = await requireFamily();
  const today = familyToday(family);
  const weekAgo = shiftDate(today, -6);

  const [children, chores, rewards, pendingCompletions, pendingRedemptions, weekCompletions, transactions] =
    await Promise.all([
      getChildren(family.id),
      getChores(family.id),
      getRewards(family.id),
      getPendingCompletions(family.id),
      getRedemptions(family.id, ["pending"]),
      getCompletionsBetween(family.id, weekAgo, today),
      getTransactions(family.id, { limit: 8 }),
    ]);

  const choreMap = new Map(chores.map((c) => [c.id, c]));
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const childMap = new Map(children.map((c) => [c.id, c]));

  const pending: PendingItem[] = [
    ...pendingCompletions.map((item) => ({
      kind: "completion" as const,
      item,
      chore: choreMap.get(item.chore_id),
      child: childMap.get(item.child_id),
    })),
    ...pendingRedemptions.map((item) => ({
      kind: "redemption" as const,
      item,
      reward: rewardMap.get(item.reward_id),
      child: childMap.get(item.child_id),
    })),
  ];

  const todayCompletions = weekCompletions.filter((c) => c.for_date === today);
  const approvedThisWeek = weekCompletions.filter((c) => c.status === "approved");
  const pointsThisWeek = approvedThisWeek.reduce((s, c) => s + (c.points_awarded ?? 0), 0);

  const perKid = children.map((kid) => {
    const due = chores.filter((c) => c.is_active && c.child_ids.includes(kid.id) && isChoreDueOn(c, today));
    const done = todayCompletions.filter((c) => c.child_id === kid.id && c.status !== "rejected");
    return { kid, dueToday: due.length, doneToday: Math.min(done.length, due.length) };
  });
  const totalDue = perKid.reduce((s, k) => s + k.dueToday, 0);
  const totalDone = perKid.reduce((s, k) => s + k.doneToday, 0);
  const weeklyCounts = Object.fromEntries(
    children.map((kid) => [kid.id, approvedThisWeek.filter((c) => c.child_id === kid.id).length])
  );

  return (
    <>
      {sp.welcome === "1" ? <WelcomeToast familyName={family.name} /> : null}
      <PageHeader title={`Good ${greeting(family.timezone)}!`} description={`Here's what's happening in ${family.name}.`}>
        <Button asChild variant="outline">
          <Link href="/app/chores?new=1">
            <PlusIcon />
            New quest
          </Link>
        </Button>
        <Button asChild>
          <Link href="/kids">
            <PlayIcon />
            Switch profile
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <FirstWeekCoach hasKids={children.length > 0} hasQuests={chores.some((c) => c.is_active)} hasRewards={rewards.some((r) => r.is_active)} />
        <Chalkboard familyId={family.id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Needs approval" value={pending.length} hint={pending.length ? "Tap approve below" : "You're all caught up"} icon="✅" tone={pending.length ? "sun" : "default"} />
        <StatCard label="Today's quests" value={`${totalDone}/${totalDue}`} hint={totalDue ? `${Math.round((totalDone / totalDue) * 100)}% complete` : "Nothing scheduled"} icon="⚔️" tone="primary" />
        <StatCard label={`${family.currency_name} this week`} value={pointsThisWeek} hint={`${approvedThisWeek.length} quests approved`} icon={family.currency_emoji} tone="mint" />
        <StatCard label="Active kids" value={children.length} hint={`${chores.filter((c) => c.is_active).length} quests · ${rewards.filter((r) => r.is_active).length} rewards`} icon="🧒" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Approval queue</h2>
            {pending.length ? <span className="text-sm text-muted-foreground">{pending.length} waiting</span> : null}
          </div>
          <ApprovalQueue items={pending} family={family} />

          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent activity</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/activity">
                View all
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          <ActivityList transactions={transactions} kids={children} family={family} compact />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Kids</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/kids">
                Manage
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          {perKid.length ? (
            <div className="grid gap-3">
              {perKid.map(({ kid, dueToday, doneToday }) => (
                <KidSummaryCard key={kid.id} child={kid} family={family} dueToday={dueToday} doneToday={doneToday} href={`/app/kids/${kid.id}`} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<UsersIcon className="size-7 text-primary" />} title="No kids yet" description="Add your first kid to start assigning quests.">
              <Button asChild>
                <Link href="/app/kids?new=1">
                  <PlusIcon />
                  Add a kid
                </Link>
              </Button>
            </EmptyState>
          )}

          <FamilyXpBar kids={children} family={family} />
          <RivalBoard kids={children} weeklyCounts={weeklyCounts} />

          <div className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 font-medium">Quick links</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickLink href="/app/chores" icon={<SwordsIcon className="size-4" />} label="Quests" count={chores.filter((c) => c.is_active).length} />
              <QuickLink href="/app/rewards" icon={<GiftIcon className="size-4" />} label="Rewards" count={rewards.filter((r) => r.is_active).length} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function QuickLink({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count: number }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-xl border p-3 text-sm transition-colors hover:bg-muted">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-muted-foreground">{count}</span>
    </Link>
  );
}

function greeting(timezone: string) {
  try {
    const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()));
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  } catch {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }
}
