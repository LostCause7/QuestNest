"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { KidDialog } from "@/components/parent/kid-dialog";
import { ParentDialog } from "@/components/parent/parent-dialog";
import { colorTheme } from "@/lib/avatars";
import { childLook, frameClass } from "@/lib/milestones";
import { nameplateClassName } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";
import type { Child, ParentProfile } from "@/types/database";

type OwnerTile = {
  name: string;
  avatarUrl: string | null;
  avatarKey?: string | null;
  colorKey?: string | null;
  motto?: string | null;
};

function OwnerAvatar({ avatarUrl, avatarKey, colorKey }: OwnerTile) {
  if (avatarUrl && !avatarKey) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="relative size-28 rounded-full object-cover shadow-xl ring-4 ring-white/40 sm:size-32"
      />
    );
  }
  return (
    <KidAvatar
      avatar={avatarKey || "fox"}
      color={colorKey || "slate"}
      size="xl"
      className="relative shadow-xl ring-4 ring-white/40 sm:size-32 sm:text-8xl"
    />
  );
}

function AddTile({ label, onClick, delay }: { label: string; onClick: () => void; delay: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
    >
      <button
        type="button"
        onClick={onClick}
        className="group flex flex-col items-center gap-4 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400"
      >
        <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="relative block">
          <span className="relative inline-flex size-28 items-center justify-center rounded-full border-4 border-dashed border-white/30 text-white/60 transition-colors group-hover:border-white/70 group-hover:text-white sm:size-32">
            <PlusIcon className="size-12" />
          </span>
        </motion.span>
        <span className="font-display text-xl font-semibold text-white/75">{label}</span>
      </button>
    </motion.li>
  );
}

export function ProfilePicker({
  kids,
  parent,
  extraParents,
  canAdd,
}: {
  kids: Child[];
  parent: OwnerTile;
  extraParents: ParentProfile[];
  canAdd: boolean;
}) {
  const [addKid, setAddKid] = useState(false);
  const [addParent, setAddParent] = useState(false);
  let delay = 0;

  return (
    <>
      <ul className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12">
        {kids.map((kid) => {
          const theme = colorTheme(kid.color);
          const look = childLook(kid.style);
          const plate = nameplateClassName(look.nameplate);
          const i = delay++;
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
                    aura={look.aura}
                    frameClassName={frameClass(look.frame)}
                    className="relative shadow-xl transition-[box-shadow] group-hover:ring-sun-400 sm:size-32 sm:text-8xl"
                  />
                </motion.span>
                <span className="flex flex-col items-center gap-0.5">
                  <span className={cn("font-display text-2xl font-semibold text-white", plate)}>{kid.nickname?.trim() || kid.name}</span>
                  {look.title ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{look.title}</span>
                  ) : null}
                </span>
              </Link>
            </motion.li>
          );
        })}
        <motion.li
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: delay++ * 0.07, type: "spring", stiffness: 260, damping: 20 }}
        >
          <Link
            href="/kids/parent"
            className="group flex flex-col items-center gap-4 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400"
          >
            <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="relative block">
              <span className="absolute -inset-2 rounded-full bg-nest-400/50 opacity-0 blur-lg transition-opacity group-hover:opacity-80" />
              <span className="block transition-[box-shadow] group-hover:[&>*]:ring-sun-400">
                <OwnerAvatar {...parent} />
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
        {extraParents.map((p) => {
          const theme = colorTheme(p.color);
          const i = delay++;
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
            >
              <Link
                href={`/kids/parents/${p.id}/pin`}
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
                    avatar={p.avatar}
                    color={p.color}
                    size="xl"
                    className="relative shadow-xl ring-4 ring-white/90 transition-[box-shadow] group-hover:ring-sun-400 sm:size-32 sm:text-8xl"
                  />
                </motion.span>
                <span className="flex flex-col items-center gap-0.5">
                  <span className="font-display text-2xl font-semibold text-white">{p.name}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    {p.motto?.trim() || "Parent"}
                  </span>
                </span>
              </Link>
            </motion.li>
          );
        })}
        {canAdd ? (
          <>
            <AddTile label="Add a kid" onClick={() => setAddKid(true)} delay={delay++ * 0.07} />
            <AddTile label="Add a parent" onClick={() => setAddParent(true)} delay={delay++ * 0.07} />
          </>
        ) : null}
      </ul>
      <KidDialog open={addKid} onOpenChange={setAddKid} />
      <ParentDialog open={addParent} onOpenChange={setAddParent} />
    </>
  );
}
