import type { Metadata } from "next";
import { FlameIcon, TrophyIcon, StarIcon, SwordsIcon } from "lucide-react";
import { KidPageHero } from "@/components/kid/page-hero";
import { UnlockTrack } from "@/components/kid/unlock-track";
import { SeasonPass } from "@/components/kid/season-pass";
import { BadgeSets } from "@/components/kid/badge-sets";
import { ReplayCelebration } from "@/components/kid/home-extras";
import { BadgeGrid } from "@/components/shared/badge-grid";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild } from "@/lib/data/kid";
import {
  familyToday,
  getApprovedCounts,
  getBadges,
  getChildGifts,
  getCompletionsBetween,
  getFamilyMilestones,
  getTransactions,
  shiftDate,
} from "@/lib/data/parent";
import { levelInfo } from "@/lib/levels";
import { lifetimeBadgeKeys } from "@/lib/badges";
import { seasonWindow } from "@/lib/cosmetics";
import { todayInTimezone } from "@/lib/schedule";
import { dateTime, signed } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Trophy room" };

export default async function KidTrophiesPage(props: PageProps<"/kids/[childId]/trophies">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const today = familyToday(family);
  const weekAgo = shiftDate(today, -6);
  const season = seasonWindow(family.created_at, today);
  const [badges, transactions, week, extras, gifts, seasonCounts] = await Promise.all([
    getBadges([child.id]),
    getTransactions(family.id, { childId: child.id, limit: 80 }),
    getCompletionsBetween(family.id, weekAgo, today),
    getFamilyMilestones(family.id),
    getChildGifts(child.id),
    getApprovedCounts(family.id, season.from, today),
  ]);
  const lvl = levelInfo(child.lifetime_points);
  const mineThisWeek = week.filter((c) => c.child_id === child.id && c.status === "approved").length;
  const todayQuests = transactions.filter(
    (t) => t.kind === "chore" && todayInTimezone(family.timezone, new Date(t.created_at)) === today
  );
  const earnedKeys = new Set([...badges.map((b) => b.badge_key), ...lifetimeBadgeKeys(child.lifetime_points)]);

  return (
    <>
      <KidPageHero
        emoji="🏆"
        title="Trophy room"
        subtitle={`Lifetime ${family.currency_name.toLowerCase()} unlock titles and looks — spending never takes them away.`}
        aside={<ReplayCelebration />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<StarIcon className="size-5" />} label="Level" value={lvl.level} sub={lvl.title} className="bg-nest-gradient" />
        <Stat icon={<FlameIcon className="size-5" />} label="Streak" value={child.current_streak} sub={`best ${child.longest_streak}`} className="bg-sunrise-gradient" />
        <Stat icon={<TrophyIcon className="size-5" />} label="Lifetime" value={child.lifetime_points} sub={family.currency_name} className="bg-mint-gradient" />
        <Stat icon={<SwordsIcon className="size-5" />} label="To next level" value={lvl.toNext} sub={family.currency_name} className="bg-gradient-to-br from-pink-400 to-fuchsia-500" />
      </div>

      {mineThisWeek > 0 ? (
        <div className="mb-5 rounded-3xl bg-sunrise-gradient p-4 text-white shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">This week&apos;s nest trophy</div>
          <div className="mt-1 font-display text-xl font-bold">
            {child.name} finished {mineThisWeek} quest{mineThisWeek === 1 ? "" : "s"} this week
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <SeasonPass childId={child.id} avatar={child.avatar} color={child.color} quests={seasonCounts[child.id] ?? 0} gifts={gifts} season={season} />
      </div>

      <div className="mb-8">
        <UnlockTrack key={child.id} child={child} family={family} extras={extras} />
      </div>

      <h3 className="mb-3 font-display text-xl font-semibold">Trophy sets</h3>
      <div className="mb-8">
        <BadgeSets earned={earnedKeys} />
      </div>

      <h3 className="mb-3 font-display text-xl font-semibold">Trophy case</h3>
      <div className="qn-kid-surface rounded-3xl p-4 shadow-md ring-1 ring-black/5">
        <BadgeGrid earned={badges} lifetimePoints={child.lifetime_points} />
      </div>

      <h3 className="mt-8 mb-3 font-display text-xl font-semibold">Today&apos;s quests</h3>
      {todayQuests.length ? (
        <ul className="qn-kid-surface divide-y rounded-3xl shadow-md ring-1 ring-black/5">
          {todayQuests.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">⚔️</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.note ?? "Quest"}</div>
                <div className="text-xs text-muted-foreground">{dateTime(t.created_at)}</div>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-sm font-bold tabular-nums", t.amount > 0 ? "bg-mint-300/60 text-emerald-800" : "bg-rose-100 text-rose-700")}>
                {signed(t.amount)} {family.currency_emoji}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="qn-kid-surface rounded-3xl p-8 text-center text-muted-foreground shadow-md ring-1 ring-black/5">
          No quests from today yet — finish one and it will show up here.
        </div>
      )}
    </>
  );
}

function Stat({ icon, label, value, sub, className }: { icon: React.ReactNode; label: string; value: number; sub: string; className: string }) {
  return (
    <div className={cn("rounded-3xl p-4 text-white shadow-md", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</div>
      <div className="truncate text-xs text-white/80">{sub}</div>
    </div>
  );
}
