"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { burst, starBurst } from "@/lib/confetti";
import { prefersReducedMotion } from "@/lib/motion";

export type CelebrationData = {
  title: string;
  subtitle?: string;
  emoji: string;
  points?: number;
  currencyEmoji?: string;
  tone?: "gold" | "pending" | "shop";
};

export function Celebration({ data, onClose, colors }: { data: CelebrationData | null; onClose: () => void; colors?: string[] }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!data) return;
    closeRef.current?.focus();
    if (prefersReducedMotion()) {
      const t = setTimeout(onClose, 2200);
      return () => clearTimeout(t);
    }
    if (data.tone === "gold") {
      burst("big", colors);
      setTimeout(starBurst, 250);
    } else if (data.tone === "shop") {
      burst("big", colors);
    } else {
      burst("small", colors);
    }
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [data, onClose, colors]);

  return (
    <AnimatePresence>
      {data ? (
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
            className="w-full max-w-sm rounded-[2rem] bg-card p-8 text-center shadow-2xl"
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
            {data.subtitle ? <p className="mt-1 text-muted-foreground">{data.subtitle}</p> : null}
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
              className="mt-6 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Tap to continue
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
