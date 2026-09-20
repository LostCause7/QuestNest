"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/database";

export function ProfilePicker({ kids }: { kids: Child[] }) {
  if (!kids.length) {
    return (
      <div className="mt-10 rounded-3xl bg-card/80 p-8 text-center shadow-sm">
        <div className="text-5xl">🪺</div>
        <p className="mt-3 font-medium">The nest is empty!</p>
        <p className="text-sm text-muted-foreground">Ask a parent to add you in the dashboard.</p>
      </div>
    );
  }
  return (
    <ul className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-8">
      {kids.map((kid, i) => {
        const theme = colorTheme(kid.color);
        return (
          <motion.li
            key={kid.id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
          >
            <Link
              href={`/kids/${kid.id}/pin`}
              className="group flex flex-col items-center gap-3 focus-visible:outline-none"
            >
              <motion.span whileHover={{ scale: 1.06, rotate: -2 }} whileTap={{ scale: 0.96 }} className="relative block">
                <span className={cn("absolute -inset-2 rounded-full bg-gradient-to-br opacity-0 blur-lg transition-opacity group-hover:opacity-70", theme.gradient)} />
                <KidAvatar avatar={kid.avatar} color={kid.color} size="xl" className="relative shadow-xl ring-4 ring-white" />
              </motion.span>
              <span className="font-display text-2xl font-semibold">{kid.name}</span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
