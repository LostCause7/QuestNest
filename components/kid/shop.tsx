"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { LockIcon, Loader2Icon, ShoppingBagIcon, ClockIcon, TargetIcon, MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { saveChildStyle } from "@/lib/actions/style";
import { styleStorageKey } from "@/lib/milestones";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Celebration, type CelebrationData } from "@/components/kid/celebration";
import { KidPageHero } from "@/components/kid/page-hero";
import { cancelRedemptionAsKid, redeemRewardAsKid } from "@/lib/actions/kid-mode";
import { cashStepOptions, formatDollars, isCashReward, pointsToDollars } from "@/lib/suggested-points";
import { play } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { Child, Family, Reward, RewardRedemption } from "@/types/database";

const RARITY: Record<string, { label: string; className: string }> = {
  rare: { label: "Rare", className: "ring-2 ring-sky-300 qn-foil-rare" },
  epic: { label: "Epic", className: "ring-2 ring-violet-400 qn-foil-epic" },
  legendary: { label: "Legendary", className: "ring-2 ring-amber-400 qn-foil" },
};

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
  const [dollars, setDollars] = useState(5);
  const [busy, setBusy] = useState(false);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);
  const [savingFor, setSavingFor] = useState<string | null>(child.style?.savingFor ?? null);

  const minCost = (r: Reward) => (isCashReward(r.title, r.description) ? cashStepOptions(r.title, r.description, child.points_balance).minPoints : r.cost);
  const affordable = rewards.filter((r) => minCost(r) <= child.points_balance);
  const saving = rewards.filter((r) => minCost(r) > child.points_balance);
  const cash = selected && isCashReward(selected.title, selected.description) ? cashStepOptions(selected.title, selected.description, child.points_balance) : null;
  const spend = cash ? cash.options.find((o) => o.dollars === dollars)?.points ?? selected?.cost ?? 0 : selected?.cost ?? 0;
  const nextGoal = rewards.find((r) => r.id === savingFor && minCost(r) > child.points_balance) ?? saving[0];

  const pickReward = (reward: Reward) => {
    if (isCashReward(reward.title, reward.description)) {
      setDollars(cashStepOptions(reward.title, reward.description, child.points_balance).defaultDollars);
    }
    setSelected(reward);
  };

  const changeMind = async (id: string) => {
    setCanceling(id);
    play("tap");
    try {
      const res = await cancelRedemptionAsKid(id);
      if (!res.ok) {
        play("error");
        toast.error(res.error);
        return;
      }
      play("approved");
      toast.success(res.message ?? "Changed your mind. Points are back!");
    } catch {
      toast.error("Could not change your mind. Try again.");
    } finally {
      setCanceling(null);
    }
  };

  const pickGoal = (reward: Reward) => {
    const next = savingFor === reward.id ? null : reward.id;
    setSavingFor(next);
    play("tap");
    const style = { ...(child.style ?? {}), savingFor: next };
    try {
      window.localStorage.setItem(styleStorageKey(child.id), JSON.stringify(style));
    } catch {
      /* ignore */
    }
    void saveChildStyle(child.id, style);
  };

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    play("tap");
    try {
    const res = await redeemRewardAsKid(selected.id, cash ? spend : undefined);
    if (!res.ok) {
      play("error");
      toast.error(res.error);
      return;
    }
    play("purchase");
    const instant = res.data?.status === "approved";
    setBought(selected.id);
    setTimeout(() => setBought(null), 900);
    setSelected(null);
    setCelebration({
      emoji: selected.icon,
      title: instant ? "It's yours!" : "Request sent!",
      subtitle: instant
        ? `Enjoy your ${selected.title}${cash ? ` (${formatDollars(dollars)})` : ""}!`
        : `Your parent will approve “${selected.title}${cash ? ` · ${formatDollars(dollars)}` : ""}” soon.`,
      points: -spend,
      currencyEmoji: family.currency_emoji,
      tone: "shop",
    });
    } catch {
      toast.error("Could not buy that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Celebration data={celebration} onClose={closeCelebration} />

      <KidPageHero
        emoji="🛍️"
        title="Reward shop"
        subtitle={
          <>
            You have <strong className="text-foreground">{child.points_balance}</strong> {family.currency_emoji} to spend.
          </>
        }
      />

      {openRedemptions.length ? (
        <div className="mb-5 rounded-3xl bg-sun-300/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <ClockIcon className="size-4" />
            Waiting for a parent
          </div>
          <p className="mt-1 text-xs text-amber-900/70">Changed your mind? Get your points back and pick something else.</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {openRedemptions.map((r) => {
              const reward = rewards.find((x) => x.id === r.reward_id);
              const cashPick = reward ? isCashReward(reward.title, reward.description) : r.cost_at_time % 250 === 0;
              return (
                <li key={r.id} className="inline-flex items-center gap-2 rounded-full bg-card py-1 pr-1 pl-3 text-sm font-medium shadow-sm">
                  <span>
                    {reward?.icon ?? "🎁"} {reward?.title ?? "Reward"}
                    {cashPick ? ` · ${formatDollars(pointsToDollars(r.cost_at_time))}` : ""}
                  </span>
                  <button
                    type="button"
                    disabled={canceling === r.id}
                    onClick={() => void changeMind(r.id)}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-rose-100 hover:text-rose-800 disabled:opacity-60"
                  >
                    {canceling === r.id ? <Loader2Icon className="size-3 animate-spin" /> : "Changed my mind"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {rewards.length === 0 ? (
        <div className="qn-kid-surface rounded-3xl p-10 text-center shadow-md ring-1 ring-black/5">
          <ShoppingBagIcon className="mx-auto size-10 text-muted-foreground" />
          <h3 className="mt-3 font-display text-xl font-semibold">The shop is empty</h3>
          <p className="text-muted-foreground">Ask a parent to add some rewards!</p>
        </div>
      ) : null}

      {nextGoal ? (
        <div className="qn-kid-surface mb-5 rounded-3xl p-4 shadow-md ring-1 ring-black/5">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <TargetIcon className="size-4" /> {savingFor === nextGoal.id ? "Saving up for" : "Closest goal"}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-3xl">{nextGoal.icon}</span>
            <div className="flex-1">
              <div className="font-display text-lg font-semibold">{nextGoal.title}</div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-sunrise-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (child.points_balance / minCost(nextGoal)) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 16 }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {minCost(nextGoal) - child.points_balance} more {family.currency_emoji} to go
                {savingFor !== nextGoal.id ? (
                  <>
                    {" · "}
                    <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => pickGoal(nextGoal)}>
                      Make this my goal
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...affordable, ...saving].map((r, i) => {
          const cashItem = isCashReward(r.title, r.description);
          const floor = minCost(r);
          const canAfford = floor <= child.points_balance;
          const soldOut = r.stock !== null && r.stock <= 0;
          const disabled = !canAfford || soldOut;
          const rarity = r.rarity ? RARITY[r.rarity] : null;
          const isGoal = savingFor === r.id;
          return (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={bought === r.id ? { opacity: 1, y: 0, scale: [1, 0.85, 1.05, 1] } : { opacity: 1, y: 0 }}
              transition={{ delay: bought === r.id ? 0 : Math.min(i * 0.04, 0.4) }}
              className="relative"
            >
              {!canAfford && !soldOut ? (
                <button
                  type="button"
                  onClick={() => pickGoal(r)}
                  aria-pressed={isGoal}
                  aria-label={isGoal ? "Stop saving for this" : "Save up for this"}
                  className={cn(
                    "absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full shadow-sm transition-all",
                    isGoal ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TargetIcon className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => pickReward(r)}
                className={cn(
                  "qn-card qn-glass-panel qn-lift group relative flex h-full w-full flex-col items-center rounded-3xl p-4 text-center",
                  disabled ? "opacity-70" : "active:scale-95",
                  rarity?.className
                )}
              >
                {rarity ? (
                  <span className="absolute top-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                    {rarity.label}
                  </span>
                ) : null}
                <span className={cn("flex size-16 items-center justify-center rounded-2xl text-4xl shadow-inner", canAfford ? "bg-sun-300/45" : "bg-muted grayscale")}>
                  {r.icon}
                </span>
                <span className="mt-3 line-clamp-2 font-display text-base font-semibold leading-tight">{r.title}</span>
                <span
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold",
                    canAfford ? "qn-chrome shadow" : "bg-muted text-muted-foreground"
                  )}
                >
                  {!canAfford ? <LockIcon className="size-3.5" /> : null}
                  {cashItem ? `from $5 · ${floor}` : r.cost} {family.currency_emoji}
                </span>
                {soldOut ? <span className="mt-1 text-xs font-semibold text-rose-600">Sold out</span> : null}
                {r.stock !== null && !soldOut ? <span className="mt-1 text-xs text-muted-foreground">{r.stock} left</span> : null}
              </button>
            </motion.li>
          );
        })}
      </ul>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && !busy && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-sm">
          {selected ? (
            <>
              <DialogHeader className="items-center text-center">
                <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-accent text-5xl">{selected.icon}</span>
                <DialogTitle className="font-display text-2xl">{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.description ?? (selected.requires_approval ? "A parent will approve this before it's yours." : "Redeem instantly!")}
                </DialogDescription>
              </DialogHeader>
              {cash ? (
                <div className="space-y-3">
                  <div className="text-center text-sm font-semibold">How much?</div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={busy || dollars <= (cash.options[0]?.dollars ?? 5)}
                      onClick={() => {
                        const prev = cash.options.filter((o) => o.dollars < dollars).at(-1);
                        if (prev) {
                          setDollars(prev.dollars);
                          play("tap");
                        }
                      }}
                      className="flex size-12 items-center justify-center rounded-2xl bg-muted font-bold hover:bg-muted/80 disabled:opacity-40"
                      aria-label="Less money"
                    >
                      <MinusIcon className="size-5" />
                    </button>
                    <div className="min-w-24 text-center">
                      <div className="font-display text-4xl font-bold">{formatDollars(dollars)}</div>
                      <div className="text-xs text-muted-foreground">in $5 steps</div>
                    </div>
                    <button
                      type="button"
                      disabled={busy || !cash.options.some((o) => o.dollars > dollars && o.affordable)}
                      onClick={() => {
                        const next = cash.options.find((o) => o.dollars > dollars && o.affordable);
                        if (next) {
                          setDollars(next.dollars);
                          play("tap");
                        }
                      }}
                      className="flex size-12 items-center justify-center rounded-2xl bg-muted font-bold hover:bg-muted/80 disabled:opacity-40"
                      aria-label="More money"
                    >
                      <PlusIcon className="size-5" />
                    </button>
                  </div>
                  <div className="rounded-2xl bg-muted p-3 text-center text-sm">
                    That costs <strong>{spend} {family.currency_emoji}</strong> · you&apos;ll have{" "}
                    <strong>{Math.max(0, child.points_balance - spend)} {family.currency_emoji}</strong> left
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-muted p-3 text-center text-sm">
                  Spend <strong>{selected.cost} {family.currency_emoji}</strong> · you&apos;ll have{" "}
                  <strong>{child.points_balance - selected.cost} {family.currency_emoji}</strong> left
                </div>
              )}
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
                  disabled={busy || spend > child.points_balance}
                  className="qn-tap qn-chrome inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-display text-lg font-bold active:scale-95 disabled:opacity-60"
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
