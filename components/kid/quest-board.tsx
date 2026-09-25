"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, ClockIcon, HeartHandshakeIcon, Loader2Icon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Celebration, type CelebrationData } from "@/components/kid/celebration";
import { KidPageHero } from "@/components/kid/page-hero";
import { completeQuest, requestSkip } from "@/lib/actions/kid-mode";
import { play } from "@/lib/sound";
import { burstFrom } from "@/lib/confetti";
import { longDate } from "@/lib/format";
import { ALL_DONE, COMBO, PRAISE, pick } from "@/lib/copy";
import { RewardIcon } from "@/components/shared/reward-icon";
import { cn } from "@/lib/utils";
import type { QuestCard, TakenQuest } from "@/lib/data/kid";
import type { Family, Child } from "@/types/database";

/** Deterministic-per-quest praise so renders stay pure. */
function praiseFor(id: string) {
  return pick(PRAISE, id);
}

const COMBO_WINDOW_MS = 10 * 60 * 1000;

/** Records a finish time and reports whether it makes a combo (3+ within the window). */
function trackCombo(recent: number[]) {
  const now = Date.now();
  const next = [...recent.filter((t) => now - t < COMBO_WINDOW_MS), now];
  return { next, now, count: next.length };
}

export function QuestBoard({
  cards,
  family,
  child,
  today,
  tomorrowPeek = [],
  takenToday = [],
}: {
  cards: QuestCard[];
  family: Family;
  child: Child;
  today: string;
  tomorrowPeek?: { title: string; icon: string }[];
  takenToday?: TakenQuest[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);
  const recent = useRef<number[]>([]);
  const comboBonus = family.combo_bonus_points ?? 0;

  const todo = cards.filter((c) => c.status === "todo" || c.status === "rejected");
  const waiting = cards.filter((c) => c.status === "pending");
  const skipped = cards.filter((c) => c.status === "excused");
  const done = cards.filter((c) => c.status === "approved");
  const total = cards.length;
  const finished = waiting.length + done.length + skipped.length;
  const allDone = total > 0 && todo.length === 0;

  const spotlight = todo.reduce((best, card) => (!best || card.chore.points > best.chore.points ? card : best), null as QuestCard | null);

  const complete = async (card: QuestCard, el?: Element | null) => {
    setBusy(card.chore.id);
    play("tap");
    try {
    const res = await completeQuest(card.chore.id);
    if (!res.ok) {
      play("error");
      toast.error(res.error);
      return;
    }
    const approved = res.data?.status === "approved";
    const { next, now, count } = trackCombo(recent.current);
    recent.current = next;
    const combo = approved && count >= 3;
    if (combo) {
      play("combo");
      toast(`${pick(COMBO, String(now))} ${count} in a row${comboBonus ? ` · +${comboBonus} bonus` : ""}`, { duration: 4000 });
    } else {
      play("questDone");
    }
    burstFrom(el ?? null, approved ? "big" : "small");
    const lastOne = approved && todo.length === 1;
    setCelebration(
      approved
        ? {
            emoji: card.chore.icon,
            title: lastOne ? pick(ALL_DONE, String(now)) : praiseFor(card.chore.id + (res.data?.id ?? "")),
            subtitle: lastOne && child.cheer?.trim() ? child.cheer.trim() : `${card.chore.title} - done!`,
            points: card.chore.points,
            currencyEmoji: family.currency_emoji,
            tone: "gold",
          }
        : {
            emoji: "📨",
            title: "Sent for approval!",
            subtitle: `Your parent will check “${card.chore.title}”. +${card.chore.points} ${family.currency_emoji} when approved.`,
            tone: "pending",
          }
    );
    } catch {
      toast.error("Could not finish that quest. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const skip = async (card: QuestCard) => {
    setBusy(card.chore.id);
    play("tap");
    try {
      const res = await requestSkip(card.chore.id);
      if (!res.ok) {
        play("error");
        toast.error(res.error);
        return;
      }
      play("questDone");
      toast("Asked your parent to skip this today.", { duration: 4000 });
    } catch {
      toast.error("Could not ask to skip. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Celebration data={celebration} onClose={closeCelebration} colors={["#ffd166", "#ff8a3d", "#6d4fe0", "#34d399"]} />

      <KidPageHero
        emoji="⚔️"
        title="Today's quests"
        subtitle={longDate(today)}
        aside={
          total ? (
            <div className="rounded-2xl bg-mint-300/50 px-3 py-1.5 text-center">
              <div className="font-display text-2xl font-bold tabular-nums leading-none">{finished}/{total}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">done</div>
            </div>
          ) : null
        }
      />

      {total ? (
        <div className="mb-5 h-3 overflow-hidden rounded-full bg-card/80 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-mint-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${(finished / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          />
        </div>
      ) : null}

      {takenToday.length || tomorrowPeek.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {takenToday.map((q) => (
            <span key={`${q.title}-${q.byName}`} className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
              <RewardIcon icon={q.icon} className="size-4" /> {q.title} · {q.byName} claimed
            </span>
          ))}
          {tomorrowPeek.map((q) => (
            <span key={q.title} className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
              Tomorrow · <RewardIcon icon={q.icon} className="size-4" /> {q.title}
            </span>
          ))}
        </div>
      ) : null}

      {total === 0 ? (
        <div className="rounded-3xl bg-card/90 p-10 text-center shadow-md ring-1 ring-black/5">
          <div className="text-6xl">🏖️</div>
          <h3 className="mt-3 font-display text-xl font-semibold">No quests today!</h3>
          <p className="text-muted-foreground">Enjoy your day off, {child.name}. Check the shop to see what you can get.</p>
        </div>
      ) : null}

      {allDone ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-4 rounded-3xl bg-nest-gradient p-5 text-white shadow-lg"
        >
          <span className="text-5xl">🎉</span>
          <div>
            <h3 className="font-display text-xl font-bold">All quests done!</h3>
            <p className="text-white/80">
              {waiting.length ? `${waiting.length} waiting for a parent thumbs-up.` : "You're a legend. Go spend those " + family.currency_name.toLowerCase() + "!"}
            </p>
          </div>
        </motion.div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {[...todo, ...waiting, ...skipped, ...done].map((card) => (
            <QuestItem
              key={card.chore.id}
              card={card}
              family={family}
              featured={spotlight?.chore.id === card.chore.id && !allDone && (card.status === "todo" || card.status === "rejected")}
              busy={busy === card.chore.id}
              disabled={busy !== null}
              onComplete={(el) => complete(card, el)}
              onSkip={card.chore.allow_skip ? () => skip(card) : undefined}
            />
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}

function Chip({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className: string;
  title?: string;
}) {
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", className)}>
      {children}
    </span>
  );
}

function QuestItem({
  card,
  family,
  featured,
  busy,
  disabled,
  onComplete,
  onSkip,
}: {
  card: QuestCard;
  family: Family;
  featured?: boolean;
  busy: boolean;
  disabled: boolean;
  onComplete: (el: Element | null) => void;
  onSkip?: () => void;
}) {
  const { chore, status } = card;
  const isDone = status === "approved";
  const isSkipWait = status === "pending" && Boolean(card.completion?.excuse);
  const isWaiting = status === "pending" && !isSkipWait;
  const isSkipped = status === "excused";
  const isRedo = status === "rejected";
  const isKindness = chore.kind === "kindness";
  const open = !isDone && !isWaiting && !isSkipWait && !isSkipped;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={isDone ? { opacity: 1, y: 0, scale: [1, 1.04, 1] } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ layout: { type: "spring", stiffness: 260, damping: 26 } }}
      className={cn(
        "qn-card qn-glass-panel qn-lift relative flex flex-col gap-3 overflow-hidden rounded-[1.75rem] p-4",
        featured && "ring-2 ring-sun-400",
        isDone && "bg-mint-300/35 qn-pattern-done",
        isWaiting && "bg-sun-300/30 qn-pattern-waiting",
        isSkipWait && "bg-sky-100/70",
        isKindness && open && "ring-pink-300"
      )}
    >
      {featured ? (
        <div className="qn-chrome -mx-4 -mt-4 px-4 py-1.5 text-center text-[11px] font-bold tracking-wide uppercase">
          Quest of the day
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-inner",
            isDone ? "bg-mint-300/70" : isWaiting ? "bg-sun-300/70" : isKindness ? "bg-pink-100" : "bg-accent"
          )}
        >
          <RewardIcon icon={chore.icon} className="size-10" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-display text-lg font-semibold leading-snug text-pretty", isDone && "text-muted-foreground line-through")}>
            {chore.title}
          </h3>
          {chore.description && open ? <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{chore.description}</p> : null}
          {isRedo && card.completion?.note ? (
            <p className="mt-2 rounded-xl bg-rose-100/80 px-2.5 py-1.5 text-xs text-rose-800">Parent: {card.completion.note}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip className="bg-sun-300/70 text-amber-950">
          +{chore.points} {family.currency_emoji}
        </Chip>
        {isKindness ? (
          <Chip className="bg-pink-100 text-pink-800">
            <HeartHandshakeIcon className="size-3.5" /> Kind
          </Chip>
        ) : null}
        {chore.single_claim && open ? (
          <Chip className="bg-violet-100 text-violet-800" title="First kid to finish this keeps it">
            1st
          </Chip>
        ) : null}
        {chore.mandatory && !isDone ? (
          <Chip className="bg-rose-100 text-rose-800" title={`Miss it and lose ${chore.points} ${family.currency_name}`}>
            Must-do
          </Chip>
        ) : null}
        {isSkipWait ? (
          <Chip className="bg-sky-100 text-sky-800">
            <ClockIcon className="size-3.5" /> Skip asked
          </Chip>
        ) : null}
        {isSkipped ? <Chip className="bg-sky-100 text-sky-800">Skipped</Chip> : null}
        {isWaiting ? (
          <Chip className="bg-amber-100 text-amber-800">
            <ClockIcon className="size-3.5" /> Waiting
          </Chip>
        ) : null}
        {isRedo ? (
          <Chip className="bg-rose-100 text-rose-800">
            <RotateCcwIcon className="size-3.5" /> Try again
          </Chip>
        ) : null}
        {isDone ? (
          <Chip className="bg-emerald-100 text-emerald-800">
            <SparklesIcon className="size-3.5" /> Earned
          </Chip>
        ) : null}
      </div>

      {isDone ? (
        <div className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-display text-base font-bold text-white shadow-md">
          <CheckIcon className="size-5" strokeWidth={3} /> Done!
        </div>
      ) : isSkipWait || isSkipped ? (
        <div className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-400 font-display text-base font-bold text-white shadow-md">
          <ClockIcon className="size-5" /> {isSkipped ? "Skipped today" : "Asked to skip"}
        </div>
      ) : isWaiting ? (
        <div className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 font-display text-base font-bold text-amber-950 shadow-md">
          <ClockIcon className="size-5" /> Waiting for a parent
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={(e) => onComplete(e.currentTarget)}
            className="qn-tap qn-chrome flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 font-display text-base font-bold disabled:opacity-60"
          >
            {busy ? <Loader2Icon className="size-5 animate-spin" /> : <CheckIcon className="size-5" strokeWidth={3} />}
            Done!
          </motion.button>
          {onSkip ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onSkip}
              aria-label="Can't do this today"
              className="h-12 shrink-0 rounded-2xl bg-muted px-3 text-xs font-bold text-muted-foreground hover:bg-sky-100 hover:text-sky-800 disabled:opacity-60"
            >
              Can&apos;t today
            </button>
          ) : null}
        </div>
      )}
    </motion.li>
  );
}
