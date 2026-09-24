"use client";

import { CheckIcon, GiftIcon, LockIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { useAction } from "@/hooks/use-action";
import { claimSeasonReward } from "@/lib/actions/season";
import { SEASON_NODES, giftKey, type CosmeticItem } from "@/lib/cosmetics";
import { play } from "@/lib/sound";
import { burst } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export function SeasonPass({
  childId,
  avatar,
  color,
  quests,
  gifts,
  season,
}: {
  childId: string;
  avatar: string;
  color: string;
  quests: number;
  gifts: string[];
  season: { number: number; daysLeft: number };
}) {
  const { run, isBusy } = useAction();
  const claimed = new Set(gifts);
  const max = SEASON_NODES[SEASON_NODES.length - 1].quests;
  const pct = Math.min(100, (quests / max) * 100);

  return (
    <div className="qn-kid-surface rounded-3xl p-4 shadow-md ring-1 ring-black/5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-semibold">Season {season.number} pass</h3>
          <p className="text-sm text-muted-foreground">
            {quests} quest{quests === 1 ? "" : "s"} this season · {season.daysLeft} day{season.daysLeft === 1 ? "" : "s"} left. Free, always.
          </p>
        </div>
      </div>
      <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-300 to-sky-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 16 }}
        />
      </div>
      <ol className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {SEASON_NODES.map((node, i) => {
          const reached = quests >= node.quests;
          const kept = claimed.has(giftKey(node.item));
          const key = `season-${i}`;
          return (
            <li key={key} className="shrink-0">
              <div
                className={cn(
                  "flex w-24 flex-col items-center gap-1.5 rounded-2xl border-2 p-2 text-center",
                  kept ? "border-emerald-300 bg-emerald-50" : reached ? "border-primary bg-primary/10 qn-shiny" : "border-dashed opacity-60 grayscale"
                )}
              >
                <Preview item={node.item} avatar={avatar} color={color} />
                <span className="text-[11px] font-semibold leading-tight">{node.item.label}</span>
                <span className="text-[10px] text-muted-foreground">{node.quests} quests</span>
                {kept ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckIcon className="size-3" /> Kept
                  </span>
                ) : reached ? (
                  <Button
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    disabled={isBusy(key)}
                    onClick={() => {
                      play("badge");
                      burst("small");
                      void run(() => claimSeasonReward(childId, i), { key });
                    }}
                  >
                    <GiftIcon className="size-3" /> Claim
                  </Button>
                ) : (
                  <LockIcon className="size-3.5 text-muted-foreground" />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Preview({ item, avatar, color }: { item: CosmeticItem; avatar: string; color: string }) {
  switch (item.kind) {
    case "frame":
      return <KidAvatar avatar={avatar} color={color} size="sm" frameClassName={item.className} />;
    case "hat":
      return <KidAvatar avatar={avatar} color={color} size="sm" hat={item.key} />;
    case "aura":
      return <KidAvatar avatar={avatar} color={color} size="sm" aura={item.key} />;
    case "color":
      return <span className={cn("size-10 rounded-full bg-gradient-to-br", item.className)} />;
    case "nameplate":
      return <span className={cn("font-display text-sm font-semibold", item.className)}>Name</span>;
    default:
      return <span className="text-3xl">{item.emoji ?? "✨"}</span>;
  }
}
