"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { ChildLookAvatar, ChildLookName } from "@/components/shared/child-look";
import { KidDialog } from "@/components/parent/kid-dialog";
import { ParentDialog } from "@/components/parent/parent-dialog";
import { colorTheme } from "@/lib/avatars";
import { useShownKid } from "@/lib/kid-look-store";
import { childLook, parseStyle } from "@/lib/milestones";
import { cn } from "@/lib/utils";
import type { Child, ParentProfile } from "@/types/database";

type OwnerTile = {
  name: string;
  avatarUrl: string | null;
  avatarKey?: string | null;
  colorKey?: string | null;
  motto?: string | null;
};

function PickerAvatarWell({ children }: { children: ReactNode }) {
  return (
    <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="relative flex size-36 items-center justify-center overflow-visible sm:size-40">
      {children}
    </motion.span>
  );
}

function OwnerAvatar({ avatarUrl, avatarKey, colorKey }: OwnerTile) {
  if (avatarUrl && !avatarKey) {
    return (
      <span className="inline-flex p-3.5">
        <img
          src={avatarUrl}
          alt=""
          className="relative size-28 rounded-full object-cover shadow-xl ring-4 ring-white/40 sm:size-32"
        />
      </span>
    );
  }
  return (
    <KidAvatar
      avatar={avatarKey || "luna"}
      color={colorKey || "slate"}
      size="xl"
      className="relative shadow-xl sm:size-32 sm:text-8xl"
    />
  );
}

function PickerKidTile({ kid, delay }: { kid: Child; delay: number }) {
  const shown = useShownKid(kid);
  const theme = colorTheme(shown.color);
  const look = childLook(parseStyle(shown.style));
  return (
    <motion.li
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.07, type: "spring", stiffness: 260, damping: 20 }}
      className="overflow-visible"
    >
      <Link
        href={`/kids/${kid.id}/pin`}
        className="group flex flex-col items-center gap-4 overflow-visible rounded-3xl px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400"
      >
        <PickerAvatarWell>
          <span
            className={cn(
              "absolute inset-3 rounded-full bg-gradient-to-br opacity-0 blur-lg transition-opacity group-hover:opacity-80",
              theme.gradient
            )}
          />
          <ChildLookAvatar
            child={shown}
            size="xl"
            className="relative shadow-xl transition-[box-shadow] group-hover:ring-sun-400 sm:size-32 sm:text-8xl"
          />
        </PickerAvatarWell>
        <span className="flex flex-col items-center gap-0.5">
          <ChildLookName child={shown} className="font-display text-2xl font-semibold text-white" />
          {look.title ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{look.title}</span>
          ) : null}
        </span>
      </Link>
    </motion.li>
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
        <PickerAvatarWell>
          <span className="relative inline-flex size-28 items-center justify-center rounded-full border-4 border-dashed border-white/30 text-white/60 transition-colors group-hover:border-white/70 group-hover:text-white sm:size-32">
            <PlusIcon className="size-12" />
          </span>
        </PickerAvatarWell>
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
      <ul className="mt-8 flex flex-wrap items-start justify-center gap-8 overflow-visible sm:mt-10 sm:gap-12">
        {kids.map((kid) => (
          <PickerKidTile key={kid.id} kid={kid} delay={delay++} />
        ))}
        <motion.li
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: delay++ * 0.07, type: "spring", stiffness: 260, damping: 20 }}
        >
          <Link
            href="/kids/parent"
            className="group flex flex-col items-center gap-4 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400"
          >
            <PickerAvatarWell>
              <span className="absolute inset-3 rounded-full bg-nest-400/50 opacity-0 blur-lg transition-opacity group-hover:opacity-80" />
              <OwnerAvatar {...parent} />
            </PickerAvatarWell>
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
                <PickerAvatarWell>
                  <span
                    className={cn(
                      "absolute inset-3 rounded-full bg-gradient-to-br opacity-0 blur-lg transition-opacity group-hover:opacity-80",
                      theme.gradient
                    )}
                  />
                  <KidAvatar
                    avatar={p.avatar}
                    color={p.color}
                    size="xl"
                    className="relative shadow-xl sm:size-32 sm:text-8xl"
                  />
                </PickerAvatarWell>
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
