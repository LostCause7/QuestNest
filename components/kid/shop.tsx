"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { LockIcon, Loader2Icon, ShoppingBagIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Celebration, type CelebrationData } from "@/components/kid/celebration";
import { redeemRewardAsKid } from "@/lib/actions/kid-mode";
import { cn } from "@/lib/utils";
import type { Child, Family, Reward, RewardRedemption } from "@/types/database";

export function Shop({
  rewards,
  child,
  family,
  openRedemptions,
}: {
  rewards: Reward[];
  child: Child;
  family: Family;
  openRedemptions: RewardRedemption[];
}) {
  const [selected, setSelected] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);

  const affordable = rewards.filter((r) => r.cost <= child.points_balance);
  const saving = rewards.filter((r) => r.cost > child.points_balance);
  const nextGoal = saving[0];

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    const res = await redeemRewardAsKid(selected.id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const instant = res.data?.status === "approved";
    setSelected(null);
    setCelebration({
      emoji: selected.icon,
      title: instant ? "It's yours!" : "Request sent!",
      subtitle: instant ? `Enjoy your ${selected.title}!` : `Your parent will approve “${selected.title}” soon.`,
      points: -selected.cost,
      currencyEmoji: family.currency_emoji,
      tone: "shop",
    });
  };

  return (
    <>
      <Celebration data={celebration} onClose={closeCelebration} />

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Reward shop</h2>
          <p className="text-sm text-muted-foreground">
            You have <strong className="text-foreground">{child.points_balance}</strong> {family.currency_emoji} to spend.
          </p>
        </div>
      </div>

      {openRedemptions.length ? (
        <div className="mb-5 rounded-3xl bg-sun-300/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <ClockIcon className="size-4" />
            Waiting for a parent
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {openRedemptions.map((r) => {
              const reward = rewards.find((x) => x.id === r.reward_id);
              return (
                <li key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-medium shadow-sm">
                  <span>{reward?.icon ?? "🎁"}</span> {reward?.title ?? "Reward"}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {rewards.length === 0 ? (
        <div className="rounded-3xl bg-card/80 p-10 text-center shadow-sm">
          <ShoppingBagIcon className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl font-semibold">The shop is empty</h3>
          <p className="text-muted-foreground">Ask a parent to add some rewards!</p>
        </div>
      ) : null}

      {nextGoal && affordable.length === 0 ? (
        <div className="mb-5 rounded-3xl bg-card/80 p-4 shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground">Saving up for</div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-3xl">{nextGoal.icon}</span>
            <div className="flex-1">
              <div className="font-display text-lg font-semibold">{nextGoal.title}</div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-sunrise-gradient" style={{ width: `${Math.min(100, (child.points_balance / nextGoal.cost) * 100)}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {nextGoal.cost - child.points_balance} more {family.currency_emoji} to go
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...affordable, ...saving].map((r, i) => {
          const canAfford = r.cost <= child.points_balance;
          const soldOut = r.stock !== null && r.stock <= 0;
          const disabled = !canAfford || soldOut;
          return (
            <motion.li key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setSelected(r)}
                className={cn(
                  "group relative flex h-full w-full flex-col items-center rounded-3xl bg-card p-4 text-center shadow-sm transition-all",
                  disabled ? "opacity-70" : "hover:-translate-y-1 hover:shadow-lg active:scale-95"
                )}
              >
                <span className={cn("flex size-16 items-center justify-center rounded-2xl text-4xl", canAfford ? "bg-accent" : "bg-muted grayscale")}>
                  {r.icon}
                </span>
                <span className="mt-3 line-clamp-2 font-display text-base font-semibold leading-tight">{r.title}</span>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold",
                    canAfford ? "bg-sunrise-gradient text-white shadow" : "bg-muted text-muted-foreground"
                  )}
                >
                  {!canAfford ? <LockIcon className="size-3.5" /> : null}
                  {r.cost} {family.currency_emoji}
                </span>
                {soldOut ? <span className="mt-1 text-xs font-semibold text-rose-600">Sold out</span> : null}
                {r.stock !== null && !soldOut ? <span className="mt-1 text-xs text-muted-foreground">{r.stock} left</span> : null}
              </button>
            </motion.li>
          );
        })}
      </ul>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && !busy && setSelected(null)}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          {selected ? (
            <>
              <DialogHeader className="items-center text-center">
                <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-accent text-5xl">{selected.icon}</span>
                <DialogTitle className="font-display text-2xl">{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.description ?? (selected.requires_approval ? "A parent will approve this before it's yours." : "Redeem instantly!")}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-2xl bg-muted p-3 text-center text-sm">
                Spend <strong>{selected.cost} {family.currency_emoji}</strong> · you&apos;ll have{" "}
                <strong>{child.points_balance - selected.cost} {family.currency_emoji}</strong> left
              </div>
              <DialogFooter className="sm:justify-center">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  disabled={busy}
                  className="h-12 rounded-2xl px-5 font-semibold text-muted-foreground hover:bg-muted"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={buy}
                  disabled={busy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-display text-lg font-bold text-primary-foreground shadow-md active:scale-95 disabled:opacity-60"
                >
                  {busy ? <Loader2Icon className="animate-spin" /> : <ShoppingBagIcon className="size-5" />}
                  Get it!
                </button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
