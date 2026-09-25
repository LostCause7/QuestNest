"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { HeartHandshakeIcon, RepeatIcon, TargetIcon } from "lucide-react";
import { celebrate, lastCelebration, onCelebrate, type CelebrationPayload } from "@/lib/celebrate";
import { timeAgo } from "@/lib/format";
import { RewardIcon } from "@/components/shared/reward-icon";
import { cn } from "@/lib/utils";
import type { ChildKudos, ChoreMissPenalty, Reward } from "@/types/database";

/** Sticky notes from parents (last 24h). */
export function KudosNotes({ kudos }: { kudos: ChildKudos[] }) {
  if (!kudos.length) return null;
  return (
    <ul className="mb-4 flex flex-wrap gap-2">
      {kudos.map((k, i) => (
        <motion.li
          key={k.id}
          initial={{ opacity: 0, rotate: -6, y: 8 }}
          animate={{ opacity: 1, rotate: i % 2 ? 2 : -2, y: 0 }}
          className="flex max-w-xs items-start gap-2 rounded-xl bg-yellow-200 px-3 py-2 text-sm text-yellow-950 shadow-md"
        >
          <span className="text-xl leading-none">{k.emoji}</span>
          <span className="min-w-0">
            <span className="block font-semibold">{k.message?.trim() || "Kudos from your parent!"}</span>
            <span className="block text-[11px] text-yellow-900/70">{timeAgo(k.created_at)}</span>
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

/** Yesterday's mandatory misses — shown so the deduction isn't a mystery. */
export function MissedMandatory({
  misses,
  titles,
  currencyEmoji,
}: {
  misses: ChoreMissPenalty[];
  titles: Record<string, string>;
  currencyEmoji: string;
}) {
  if (!misses.length) return null;
  return (
    <ul className="mb-4 space-y-2">
      {misses.map((m) => (
        <li
          key={m.id}
          className="flex items-center gap-3 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm ring-1 ring-rose-200"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-200 text-lg">⚠️</span>
          <span>
            Missed {titles[m.chore_id] || "a must-do quest"} · −{m.points} {currencyEmoji}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Hearts meter for approved kindness quests. */
export function KindnessMeter({ count }: { count: number }) {
  if (count <= 0) return null;
  const next = count < 10 ? 10 : Math.ceil((count + 1) / 10) * 10;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-3xl bg-pink-50 px-4 py-3 text-pink-900 shadow-sm ring-1 ring-pink-200">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pink-200">
        <HeartHandshakeIcon className="size-5 text-pink-600" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">
          {count} kindness quest{count === 1 ? "" : "s"}
        </div>
        <div className="mt-1 flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={cn("text-sm", i < count % 10 || (count > 0 && count % 10 === 0) ? "" : "opacity-25 grayscale")}>
              💗
            </span>
          ))}
        </div>
      </div>
      <div className="text-xs text-pink-700">{next - count} to Kind Heart</div>
    </div>
  );
}

/** Save-up meter for the reward the kid picked in the Shop. */
export function SaveUpMeter({ reward, balance, currencyEmoji, childId }: { reward: Reward | null; balance: number; currencyEmoji: string; childId: string }) {
  if (!reward) return null;
  const pct = Math.min(100, (balance / Math.max(1, reward.cost)) * 100);
  const left = Math.max(0, reward.cost - balance);
  return (
    <Link href={`/kids/${childId}/shop`} className="mb-4 flex items-center gap-3 rounded-3xl bg-card/90 px-4 py-3 shadow-md ring-1 ring-black/5">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-sun-300/50 text-3xl">
        <RewardIcon icon={reward.icon} className="size-9" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <TargetIcon className="size-4 text-primary" /> Saving for {reward.title}
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-sunrise-gradient" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 60, damping: 16 }} />
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{left === 0 ? "You can get it now!" : `${left} more ${currencyEmoji} to go`}</div>
      </div>
    </Link>
  );
}

const subscribeCelebrate = (cb: () => void) => onCelebrate(cb);
const noCelebration = () => null;

/** Re-plays the last celebration this session. */
export function ReplayCelebration() {
  const last = useSyncExternalStore<CelebrationPayload | null>(subscribeCelebrate, lastCelebration, noCelebration);
  if (!last) return null;
  return (
    <button
      type="button"
      onClick={() => celebrate({ ...last, quiet: false })}
      className="qn-no-print inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm hover:text-foreground"
    >
      <RepeatIcon className="size-3.5" /> Replay last celebration
    </button>
  );
}
