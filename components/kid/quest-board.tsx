"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, ClockIcon, Loader2Icon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Celebration, type CelebrationData } from "@/components/kid/celebration";
import { completeQuest } from "@/lib/actions/kid-mode";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuestCard } from "@/lib/data/kid";
import type { Family, Child } from "@/types/database";

const PRAISE = ["Nailed it!", "Boom!", "Legendary!", "You rock!", "Way to go!", "Superstar!", "Crushed it!"];

/** Deterministic-per-quest praise so renders stay pure. */
function praiseFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PRAISE[h % PRAISE.length];
}

export function QuestBoard({ cards, family, child, today }: { cards: QuestCard[]; family: Family; child: Child; today: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);

  const todo = cards.filter((c) => c.status === "todo" || c.status === "rejected");
  const waiting = cards.filter((c) => c.status === "pending");
  const done = cards.filter((c) => c.status === "approved");
  const total = cards.length;
  const finished = waiting.length + done.length;
  const allDone = total > 0 && todo.length === 0;

  const complete = async (card: QuestCard) => {
    setBusy(card.chore.id);
    const res = await completeQuest(card.chore.id);
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const approved = res.data?.status === "approved";
    setCelebration(
      approved
        ? {
            emoji: card.chore.icon,
            title: praiseFor(card.chore.id + (res.data?.id ?? "")),
            subtitle: `${card.chore.title} - done!`,
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
  };

  return (
    <>
      <Celebration data={celebration} onClose={closeCelebration} />

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Today&apos;s quests</h2>
          <p className="text-sm text-muted-foreground">{longDate(today)}</p>
        </div>
        {total ? (
          <div className="text-right">
            <div className="font-display text-2xl font-bold tabular-nums">
              {finished}/{total}
            </div>
            <div className="text-xs text-muted-foreground">finished</div>
          </div>
        ) : null}
      </div>

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

      {total === 0 ? (
        <div className="rounded-3xl bg-card/80 p-10 text-center shadow-sm">
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

      <ul className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {[...todo, ...waiting, ...done].map((card) => (
            <QuestItem
              key={card.chore.id}
              card={card}
              family={family}
              busy={busy === card.chore.id}
              disabled={busy !== null}
              onComplete={() => complete(card)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </>
  );
}

function QuestItem({
  card,
  family,
  busy,
  disabled,
  onComplete,
}: {
  card: QuestCard;
  family: Family;
  busy: boolean;
  disabled: boolean;
  onComplete: () => void;
}) {
  const { chore, status } = card;
  const isDone = status === "approved";
  const isWaiting = status === "pending";
  const isRedo = status === "rejected";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-4 overflow-hidden rounded-3xl bg-card p-4 shadow-sm transition-shadow",
        isDone && "bg-mint-300/30",
        isWaiting && "bg-sun-300/25"
      )}
    >
      <span
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-inner",
          isDone ? "bg-mint-300/60" : isWaiting ? "bg-sun-300/60" : "bg-accent"
        )}
      >
        {chore.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className={cn("font-display text-lg font-semibold leading-tight", isDone && "text-muted-foreground line-through")}>{chore.title}</h3>
        {chore.description && !isDone ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{chore.description}</p> : null}
        <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-sun-300/50 px-2 py-0.5">
            +{chore.points} {family.currency_emoji}
          </span>
          {isWaiting ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <ClockIcon className="size-3.5" /> Waiting for approval
            </span>
          ) : null}
          {isRedo ? (
            <span className="inline-flex items-center gap-1 text-rose-600">
              <RotateCcwIcon className="size-3.5" /> Try again
            </span>
          ) : null}
          {isDone ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <SparklesIcon className="size-3.5" /> Earned!
            </span>
          ) : null}
        </div>
      </div>
      {isDone ? (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
          <CheckIcon className="size-6" strokeWidth={3} />
        </span>
      ) : isWaiting ? (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow-md">
          <ClockIcon className="size-6" />
        </span>
      ) : (
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          onClick={onComplete}
          className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 font-display text-base font-bold text-primary-foreground shadow-md transition-all hover:brightness-105 disabled:opacity-60"
        >
          {busy ? <Loader2Icon className="size-5 animate-spin" /> : <CheckIcon className="size-5" strokeWidth={3} />}
          Done!
        </motion.button>
      )}
    </motion.li>
  );
}
