"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { colorTheme } from "@/lib/avatars";
import { childLook, frameClass } from "@/lib/milestones";
import { cn } from "@/lib/utils";
import type { Child } from "@/types/database";

type ParentTile = {
  name: string;
  avatarUrl: string | null;
  avatarKey?: string | null;
  colorKey?: string | null;
  motto?: string | null;
};

function ParentAvatar({ avatarUrl, avatarKey, colorKey }: ParentTile) {
  if (avatarKey) {
    return (
      <KidAvatar
        avatar={avatarKey}
        color={colorKey ?? "sky"}
        size="xl"
        className="relative shadow-xl ring-4 ring-white/90 sm:size-32 sm:text-8xl"
      />
    );
  }
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="relative size-28 rounded-full object-cover shadow-xl ring-4 ring-white/90 sm:size-32"
      />
    );
  }
  return (
    <span
      className="relative inline-flex size-28 items-center justify-center rounded-full bg-nest-gradient text-white shadow-xl ring-4 ring-white/90 sm:size-32"
      aria-hidden="true"
    >
      <ShieldIcon className="size-12" />
    </span>
  );
}

export function ProfilePicker({ kids, parent }: { kids: Child[]; parent: ParentTile }) {
  return (
    <ul className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12">
      {kids.map((kid, i) => {
        const theme = colorTheme(kid.color);
        const look = childLook(kid.style);
        return (
          <motion.li
            key={kid.id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
          >
            <Link
              href={`/kids/${kid.id}/pin`}
              className="group flex flex-col items-center gap-4 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400"
            >
              <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="relative block">
                <span
                  className={cn(
                    "absolute -inset-2 rounded-full bg-gradient-to-br opacity-0 blur-lg transition-opacity group-hover:opacity-80",
                    theme.gradient
                  )}
                />
                <KidAvatar
                  avatar={kid.avatar}
                  color={kid.color}
                  size="xl"
                  sticker={look.sticker}
                  frameClassName={frameClass(look.frame)}
                  className="relative shadow-xl transition-[box-shadow] group-hover:ring-sun-400 sm:size-32 sm:text-8xl"
                />
              </motion.span>
              <span className="flex flex-col items-center gap-0.5">
                <span className="font-display text-2xl font-semibold text-white">{kid.nickname?.trim() || kid.name}</span>
                {look.title ? <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{look.title}</span> : null}
              </span>
            </Link>
          </motion.li>
        );
      })}
      <motion.li
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: kids.length * 0.07, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Link
          href="/kids/parent"
          className="group flex flex-col items-center gap-4 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400"
        >
          <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="relative block">
            <span className="absolute -inset-2 rounded-full bg-nest-400/50 opacity-0 blur-lg transition-opacity group-hover:opacity-80" />
            <span className="block transition-[box-shadow] group-hover:[&>*]:ring-sun-400">
              <ParentAvatar {...parent} />
            </span>
          </motion.span>
          <span className="flex flex-col items-center gap-0.5">
            <span className="font-display text-2xl font-semibold text-white">{parent.name}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              {parent.motto?.trim() || "Parent"}
            </span>
          </span>
        </Link>
      </motion.li>
    </ul>
  );
}
