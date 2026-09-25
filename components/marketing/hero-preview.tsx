"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckIcon, FlameIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { RewardIcon } from "@/components/shared/reward-icon";

const STARTER = [
  { icon: "🛏️", title: "Make your bed", pts: 5, done: true },
  { icon: "🐾", title: "Feed Biscuit", pts: 10, done: true },
  { icon: "📖", title: "Read 20 minutes", pts: 10, done: false },
  { icon: "🍽️", title: "Clear the table", pts: 10, done: false },
];

/** Animated mock of Kid Mode used in the landing hero. */
export function HeroPreview() {
  const [quests, setQuests] = useState(STARTER);
  return (
    <div className="relative mx-auto w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="kid-mode qn-glass-panel rounded-[2rem] p-4 text-foreground"
      >
        <div className="qn-glass flex items-center gap-3 rounded-3xl p-3">
          <KidAvatar avatar="luna" color="coral" size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-display text-lg font-semibold">Maya</div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                <FlameIcon className="size-3" /> 6 days
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground">Lv 4 · Explorer</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full bg-gradient-to-r from-nest-400 to-nest-600" initial={{ width: 0 }} animate={{ width: "62%" }} transition={{ duration: 1, delay: 0.8 }} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold">240</div>
            <div className="text-[10px] font-medium text-muted-foreground">⭐ Stars</div>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {quests.map((q, i) => (
            <motion.li
              key={q.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12 }}
              className={`qn-lift flex items-center gap-3 rounded-2xl p-3 ${q.done ? "bg-mint-300/30" : "qn-glass"}`}
            >
              <span className={`flex size-10 items-center justify-center rounded-xl text-xl ${q.done ? "bg-mint-300/60" : "bg-accent"}`}>
                <RewardIcon icon={q.icon} className="size-7" />
              </span>
              <span className={`flex-1 font-display text-sm font-semibold ${q.done ? "text-muted-foreground line-through" : ""}`}>{q.title}</span>
              <span className="rounded-full bg-sun-300/50 px-2 py-0.5 text-[11px] font-bold">+{q.pts} ⭐</span>
              {q.done ? (
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckIcon className="size-4" strokeWidth={3} />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuests((list) => list.map((item) => (item.title === q.title ? { ...item, done: true } : item)))}
                  className="qn-chrome rounded-full px-3 py-1.5 font-display text-xs font-bold"
                >
                  Done!
                </button>
              )}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 16 }}
        className="qn-glass-panel absolute -top-6 -right-4 rounded-2xl px-4 py-3 sm:-right-10"
      >
        <div className="text-xs font-semibold text-muted-foreground">Parent HQ</div>
        <div className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="size-2 rounded-full bg-emerald-500" /> Approved “Feed Biscuit” +10
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="qn-glass-panel absolute -bottom-6 -left-4 flex items-center gap-2 rounded-2xl px-4 py-3 sm:-left-10"
      >
        <span className="text-2xl">🔥</span>
        <div>
          <div className="text-sm font-bold text-foreground">Streak: 6 days</div>
          <div className="text-xs text-muted-foreground">1 more for the “On Fire” trophy</div>
        </div>
      </motion.div>
    </div>
  );
}
