"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  EyeOffIcon,
  EyeIcon,
  Trash2Icon,
  LibraryIcon,
  GiftIcon,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/parent/page-header";
import { RewardDialog } from "@/components/parent/reward-dialog";
import { NearbyRewardsButton } from "@/components/parent/nearby-rewards";
import { RewardPurchases } from "@/components/parent/reward-purchases";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import { useAction } from "@/hooks/use-action";
import { deleteReward, setRewardActive, type RewardInput } from "@/lib/actions/rewards";
import { REWARD_PACK } from "@/lib/templates";
import { RewardIcon } from "@/components/shared/reward-icon";
import { isCashReward } from "@/lib/suggested-points";
import { cn } from "@/lib/utils";
import type { Child, Family, RewardFundWithPledges, RewardRedemption } from "@/types/database";
import type { RewardWithKids } from "@/lib/data/parent";

export function RewardsManager({
  rewards,
  redemptions,
  kids,
  family,
  funds = [],
}: {
  rewards: RewardWithKids[];
  redemptions: RewardRedemption[];
  kids: Child[];
  family: Family;
  funds?: RewardFundWithPledges[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { run, pending, isBusy } = useAction();

  const openedViaQuery = searchParams.get("new") === "1";
  const [dialogOpen, setDialogOpen] = useState(openedViaQuery);
  const [editing, setEditing] = useState<RewardWithKids | null>(null);
  const [preset, setPreset] = useState<Partial<RewardInput> | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [deleting, setDeleting] = useState<RewardWithKids | null>(null);

  useEffect(() => {
    if (openedViaQuery) router.replace("/app/rewards");
  }, [openedViaQuery, router]);

  const active = rewards.filter((r) => r.is_active);
  const hidden = rewards.filter((r) => !r.is_active);
  const purchases = [
    ...redemptions.filter((r) => r.status === "pending" || r.status === "approved"),
    ...redemptions.filter((r) => r.status === "fulfilled" || r.status === "rejected").slice(0, 40),
  ];

  const openNew = (p?: Partial<RewardInput>) => {
    setEditing(null);
    setPreset(p ?? null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <NearbyRewardsButton family={family} kids={kids} />
        <Button variant="outline" onClick={() => setLibraryOpen(true)}>
          <LibraryIcon />
          <span className="hidden sm:inline">Reward ideas</span>
          <span className="sm:hidden">Ideas</span>
        </Button>
        <Button onClick={() => openNew()}>
          <PlusIcon />
          New reward
        </Button>
      </div>

      <div className="mb-8">
        <RewardPurchases redemptions={purchases} rewards={rewards} kids={kids} family={family} />
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold">The shop</h2>
      {active.length === 0 && hidden.length === 0 ? (
        <EmptyState icon={<GiftIcon className="size-7 text-primary" />} title="The shop is empty" description="Add rewards your kids can save up for - privileges, treats and experiences all work.">
          <Button variant="outline" onClick={() => setLibraryOpen(true)}>
            <LibraryIcon /> Browse ideas
          </Button>
          <Button onClick={() => openNew()}>
            <PlusIcon /> New reward
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              family={family}
              fund={funds.find((f) => f.reward_id === r.id)}
              kids={kids}
              busy={isBusy(r.id)}
              onEdit={() => {
                setEditing(r);
                setPreset(null);
                setDialogOpen(true);
              }}
              onToggle={() => run(() => setRewardActive(r.id, false), { key: r.id })}
              onDelete={() => setDeleting(r)}
            />
          ))}
        </ul>
      )}

      {hidden.length ? (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-muted-foreground">Hidden from shop</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {hidden.map((r) => (
              <RewardCard
                key={r.id}
                reward={r}
                family={family}
                fund={funds.find((f) => f.reward_id === r.id)}
                kids={kids}
                hidden
                busy={isBusy(r.id)}
                onEdit={() => {
                  setEditing(r);
                  setPreset(null);
                  setDialogOpen(true);
                }}
                onToggle={() => run(() => setRewardActive(r.id, true), { key: r.id })}
                onDelete={() => setDeleting(r)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <RewardDialog open={dialogOpen} onOpenChange={setDialogOpen} reward={editing} preset={preset} family={family} kids={kids} />

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Reward ideas</DialogTitle>
            <DialogDescription>Tap one to customize the price and details before adding it.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 sm:grid-cols-2">
            {REWARD_PACK.map((t) => (
              <li key={t.title}>
                <button
                  type="button"
                  onClick={() => {
                    setLibraryOpen(false);
                    openNew({ title: t.title, icon: t.icon, cost: t.cost, category: t.category, requires_approval: true });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted"
                >
                  <RewardIcon icon={t.icon} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className="text-xs text-muted-foreground capitalize">{t.category}</span>
                  </span>
                  <Badge variant="secondary">
                    {t.cost} {family.currency_emoji}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="Past redemptions stay in history. You can hide it from the shop instead."
        pending={pending}
        onConfirm={() => deleting && run(() => deleteReward(deleting.id), { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

function RewardCard({
  reward,
  family,
  fund,
  kids,
  hidden,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  reward: RewardWithKids;
  family: Family;
  fund?: RewardFundWithPledges;
  kids: Child[];
  hidden?: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const soldOut = reward.stock !== null && reward.stock <= 0;
  const kidName = (id: string) => kids.find((k) => k.id === id)?.name ?? "A kid";
  return (
    <li className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm", hidden && "opacity-60")}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
          <RewardIcon icon={reward.icon} className="size-8" />
        </span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="block truncate text-left font-medium hover:underline">
            {reward.title}
          </button>
          <div className="text-xs text-muted-foreground capitalize">
            {reward.category}
            {reward.stock !== null ? ` · ${soldOut ? "sold out" : `${reward.stock} left`}` : ""}
            {reward.source_key ? " · nearby" : ""}
          </div>
          {fund ? (
            <div className="mt-2">
              <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sunrise-gradient"
                  style={{ width: `${Math.min(100, (fund.raised / fund.target) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Shared pot {fund.raised}/{fund.target} {family.currency_emoji} ·{" "}
                {fund.pledges.map((p) => kidName(p.child_id)).join(", ")}
              </p>
            </div>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More" disabled={busy}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {hidden ? (
                <>
                  <EyeIcon /> Show in shop
                </>
              ) : (
                <>
                  <EyeOffIcon /> Hide from shop
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {reward.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{reward.description}</p> : null}
      <div className="mt-auto flex items-center justify-end gap-1.5">
        {!reward.requires_approval ? (
          <Badge variant="outline" className="gap-1 text-[11px]">
            <CheckIcon className="size-3" /> Instant
          </Badge>
        ) : null}
        {isCashReward(reward.title, reward.description) ? (
          <Badge variant="outline" className="text-[11px]">
            Kids pick $5s
          </Badge>
        ) : null}
        <Badge className="bg-sun-300/50 text-foreground hover:bg-sun-300/50">
          {reward.cost} {family.currency_emoji}
        </Badge>
      </div>
    </li>
  );
}
