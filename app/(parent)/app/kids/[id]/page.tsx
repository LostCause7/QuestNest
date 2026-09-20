import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, FlameIcon, TrophyIcon, SwordsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { BadgeGrid } from "@/components/shared/badge-grid";
import { ActivityList } from "@/components/parent/activity-list";
import { StatCard } from "@/components/parent/stat-card";
import { requireFamily } from "@/lib/data/family";
import { getBadges, getChildren, getChores, getTransactions, getRedemptions, getRewards } from "@/lib/data/parent";
import { levelInfo } from "@/lib/levels";
import { describeSchedule } from "@/lib/schedule";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Kid profile" };

export default async function KidDetailPage(props: PageProps<"/app/kids/[id]">) {
  const { id } = await props.params;
  const family = await requireFamily();
  const kids = await getChildren(family.id, true);
  const kid = kids.find((k) => k.id === id);
  if (!kid) notFound();

  const [badges, chores, transactions, redemptions, rewards] = await Promise.all([
    getBadges([kid.id]),
    getChores(family.id),
    getTransactions(family.id, { childId: kid.id, limit: 30 }),
    getRedemptions(family.id, undefined, 20),
    getRewards(family.id),
  ]);
  const myChores = chores.filter((c) => c.child_ids.includes(kid.id) && c.is_active);
  const myRedemptions = redemptions.filter((r) => r.child_id === kid.id);
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const lvl = levelInfo(kid.lifetime_points);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/app/kids">
          <ArrowLeftIcon />
          All kids
        </Link>
      </Button>

      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center">
        <KidAvatar avatar={kid.avatar} color={kid.color} size="xl" />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold">{kid.name}</h1>
          <p className="text-muted-foreground">
            Level {lvl.level} · {lvl.title}
          </p>
          <div className="mt-3 max-w-sm space-y-1">
            <Progress value={lvl.progress * 100} className="h-2.5" />
            <div className="text-xs text-muted-foreground">
              {lvl.toNext} more lifetime {family.currency_name.toLowerCase()} to level {lvl.level + 1}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-80">
          <StatCard label="Balance" value={kid.points_balance} icon={family.currency_emoji} tone="primary" className="p-3" />
          <StatCard label="Streak" value={kid.current_streak} hint={`best ${kid.longest_streak}`} icon={<FlameIcon className="size-5" />} tone="sun" className="p-3" />
          <StatCard label="Lifetime" value={kid.lifetime_points} icon={<TrophyIcon className="size-5" />} tone="mint" className="p-3" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Trophies</h2>
          <BadgeGrid earned={badges} size="sm" />
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Assigned quests</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/chores">Manage</Link>
            </Button>
          </div>
          {myChores.length ? (
            <ul className="divide-y rounded-2xl border bg-card">
              {myChores.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xl">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{describeSchedule(c)}</div>
                  </div>
                  <Badge variant="secondary">
                    +{c.points} {family.currency_emoji}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              <SwordsIcon className="mx-auto mb-2 size-6" />
              No quests assigned yet.
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Activity</h2>
          <ActivityList transactions={transactions} kids={[kid]} family={family} />
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Reward history</h2>
          {myRedemptions.length ? (
            <ul className="divide-y rounded-2xl border bg-card">
              {myRedemptions.map((r) => {
                const reward = rewardMap.get(r.reward_id);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xl">{reward?.icon ?? "🎁"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{reward?.title ?? "Reward"}</div>
                      <div className="text-xs text-muted-foreground">{dateTime(r.requested_at)}</div>
                    </div>
                    <Badge variant={r.status === "rejected" ? "destructive" : r.status === "pending" ? "outline" : "secondary"} className="capitalize">
                      {r.status}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing redeemed yet.</div>
          )}
        </section>
      </div>
    </>
  );
}
