import { KidAvatar } from "@/components/shared/avatar-picker";
import { BADGE_MAP } from "@/lib/badges";
import { childLook, frameClass } from "@/lib/milestones";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Child, ChildBadge, ChoreCompletion, Family, PointTransaction } from "@/types/database";

type Moment = { at: string; emoji: string; text: string; tone: "gold" | "mint" | "sun" | "pink" };

/**
 * "This week's hero" + a short highlight reel built from data HQ already loads.
 * Server component; no extra queries.
 */
export function Highlights({
  kids,
  family,
  weekCompletions,
  transactions,
  badges = [],
}: {
  kids: Child[];
  family: Family;
  weekCompletions: ChoreCompletion[];
  transactions: PointTransaction[];
  badges?: ChildBadge[];
}) {
  if (!kids.length) return null;
  const name = (id: string) => {
    const k = kids.find((c) => c.id === id);
    return k ? k.nickname?.trim() || k.name : "Someone";
  };

  const approved = weekCompletions.filter((c) => c.status === "approved");
  const counts = new Map<string, number>();
  for (const c of approved) counts.set(c.child_id, (counts.get(c.child_id) ?? 0) + 1);
  const heroId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const hero = heroId ? kids.find((k) => k.id === heroId) : null;
  const heroCount = heroId ? counts.get(heroId) ?? 0 : 0;
  const streaker = [...kids].sort((a, b) => b.current_streak - a.current_streak)[0];

  const moments: Moment[] = [];
  const bigQuest = [...transactions].filter((t) => t.kind === "chore").sort((a, b) => b.amount - a.amount)[0];
  if (bigQuest) moments.push({ at: bigQuest.created_at, emoji: "⚔️", text: `${name(bigQuest.child_id)} earned +${bigQuest.amount} ${family.currency_emoji} for ${bigQuest.note ?? "a quest"}`, tone: "gold" });
  for (const t of transactions.filter((t) => t.kind === "bonus").slice(0, 2)) {
    moments.push({ at: t.created_at, emoji: "🌟", text: `${name(t.child_id)} got a bonus: ${t.note ?? "nice work"} (+${t.amount})`, tone: "sun" });
  }
  for (const b of [...badges].sort((a, b) => b.earned_at.localeCompare(a.earned_at)).slice(0, 2)) {
    const def = BADGE_MAP[b.badge_key];
    if (def) moments.push({ at: b.earned_at, emoji: def.emoji, text: `${name(b.child_id)} earned the ${def.name} trophy`, tone: "pink" });
  }
  const reward = transactions.find((t) => t.kind === "reward");
  if (reward) moments.push({ at: reward.created_at, emoji: "🎁", text: `${name(reward.child_id)} cashed in ${reward.note ?? "a reward"}`, tone: "mint" });
  moments.sort((a, b) => b.at.localeCompare(a.at));

  if (!hero && !moments.length) return null;

  return (
    <section className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
      {hero ? (
        <div className="qn-glass-panel relative overflow-hidden rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">This week&apos;s hero</div>
          <div className="mt-2 flex items-center gap-3">
            <KidAvatar
              avatar={hero.avatar}
              color={hero.color}
              size="lg"
              aura={childLook(hero.style).aura}
              frameClassName={frameClass(childLook(hero.style).frame)}
            />
            <div className="min-w-0">
              <div className="font-display text-2xl font-semibold text-white">
                {hero.nickname?.trim() || hero.name}
              </div>
              <div className="text-sm text-slate-200">
                {heroCount} quest{heroCount === 1 ? "" : "s"} approved this week
                {streaker && streaker.current_streak > 1 ? ` · ${streaker.nickname?.trim() || streaker.name} is on a ${streaker.current_streak}-day streak` : ""}
              </div>
            </div>
          </div>
          <span className="pointer-events-none absolute -right-4 -bottom-6 text-8xl opacity-25" aria-hidden="true">
            🏆
          </span>
        </div>
      ) : null}
      {moments.length ? (
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highlight reel</div>
          <ul className="mt-2 space-y-2">
            {moments.slice(0, 4).map((m, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-base",
                    m.tone === "gold" && "bg-amber-100",
                    m.tone === "sun" && "bg-yellow-100",
                    m.tone === "mint" && "bg-emerald-100",
                    m.tone === "pink" && "bg-pink-100"
                  )}
                >
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate">{m.text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{dateTime(m.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
