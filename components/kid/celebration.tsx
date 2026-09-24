"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { burst, starBurst } from "@/lib/confetti";
import { prefersReducedMotion } from "@/lib/motion";
import { onCelebrate, type CelebrationPayload, type CelebrationTone } from "@/lib/celebrate";
import { play, type SoundEvent } from "@/lib/sound";

export type CelebrationData = CelebrationPayload;

const TONE_SOUND: Record<CelebrationTone, SoundEvent | null> = {
  gold: "questDone",
  pending: null,
  shop: "purchase",
  badge: "badge",
  level: "levelUp",
  streak: "streak",
  sunrise: "sunrise",
  comeback: "comeback",
  kudos: "kudos",
};

const TONE_BG: Partial<Record<CelebrationTone, string>> = {
  badge: "bg-sunrise-gradient text-white",
  level: "bg-nest-gradient text-white",
  streak: "bg-gradient-to-br from-orange-400 to-rose-500 text-white",
  sunrise: "bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200",
  comeback: "bg-gradient-to-br from-sky-200 to-violet-200",
  kudos: "bg-gradient-to-br from-pink-200 to-rose-300",
};

export function Celebration({ data, onClose, colors }: { data: CelebrationData | null; onClose: () => void; colors?: string[] }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!data) return;
    closeRef.current?.focus();
    const tone = data.tone ?? "gold";
    const sound = TONE_SOUND[tone];
    if (sound && tone !== "gold") play(sound);
    if (prefersReducedMotion()) {
      const t = setTimeout(onClose, 2200);
      return () => clearTimeout(t);
    }
    const palette = data.colors ?? colors;
    if (tone === "gold" || tone === "badge" || tone === "level") {
      burst("big", palette);
      setTimeout(starBurst, 250);
    } else if (tone === "shop" || tone === "streak" || tone === "comeback") {
      burst("big", palette);
    } else if (tone === "sunrise") {
      burst("epic", palette ?? ["#fde68a", "#fdba74", "#fda4af", "#fef3c7"]);
    } else {
      burst("small", palette);
    }
    const t = setTimeout(onClose, tone === "level" || tone === "badge" ? 4200 : 3200);
    return () => clearTimeout(t);
  }, [data, onClose, colors]);

  const tone = data?.tone ?? "gold";

  return (
    <AnimatePresence>
      {data && !data.quiet ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebration-title"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className={`w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl ${TONE_BG[tone] ?? "bg-card"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-7xl"
            >
              {data.emoji}
            </motion.div>
            <h2 id="celebration-title" className="mt-4 font-display text-3xl font-bold">{data.title}</h2>
            {data.subtitle ? <p className="mt-1 opacity-80">{data.subtitle}</p> : null}
            {typeof data.points === "number" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-sunrise-gradient px-5 py-2 font-display text-2xl font-bold text-white shadow-lg"
              >
                {data.points > 0 ? "+" : ""}
                {data.points} {data.currencyEmoji}
              </motion.div>
            ) : null}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="mt-6 text-xs font-medium opacity-70 underline-offset-2 hover:underline"
            >
              Tap to continue
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Mount once in the kid layout: listens to the celebration bus and renders whatever fires. */
export function KidCelebrations() {
  const [data, setData] = useState<CelebrationData | null>(null);
  const close = useCallback(() => setData(null), []);
  useEffect(() => onCelebrate((p) => setData({ ...p })), []);
  return <Celebration data={data} onClose={close} />;
}
