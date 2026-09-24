"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Counts from the previous balance to the new one so points feel like they land. */
export function PointsTicker({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    const start = performance.now();
    const duration = prefersReducedMotion() ? 0 : Math.min(900, 300 + Math.abs(value - from) * 25);
    let frame = 0;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <motion.div
      key={value}
      initial={{ scale: 1.3, color: "var(--color-sun-600)" }}
      animate={{ scale: 1, color: "var(--color-foreground)" }}
      className={cn(className)}
    >
      {shown}
    </motion.div>
  );
}
