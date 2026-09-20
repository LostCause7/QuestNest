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
  PackageCheckIcon,
  XIcon,
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
import { KidAvatar } from "@/components/shared/avatar-picker";
import { EmptyState } from "@/components/parent/page-header";
import { RewardDialog } from "@/components/parent/reward-dialog";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import { useAction } from "@/hooks/use-action";
import { deleteReward, setRewardActive, resolveRedemption, type RewardInput } from "@/lib/actions/rewards";
import { REWARD_PACK } from "@/lib/templates";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Child, Family, Reward, RewardRedemption } from "@/types/database";

export function RewardsManager({
  rewards,
  redemptions,
  kids,
  family,
}: {
  rewards: Reward[];
  redemptions: RewardRedemption[];
  kids: Child[];
  family: Family;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { run, pending, isBusy } = useAction();

  const openedViaQuery = searchParams.get("new") === "1";
  const [dialogOpen, setDialogOpen] = useState(openedViaQuery);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [preset, setPreset] = useState<Partial<RewardInput> | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [deleting, setDeleting] = useState<Reward | null>(null);

  useEffect(() => {
    if (openedViaQuery) router.replace("/app/rewards");
  }, [openedViaQuery, router]);

  const kidMap = new Map(kids.map((k) => [k.id, k]));
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const active = rewards.filter((r) => r.is_active);
  const hidden = rewards.filter((r) => !r.is_active);
  const open = redemptions.filter((r) => r.status === "pending" || r.status === "approved");
  const history = redemptions.filter((r) => r.status === "fulfilled" || r.status === "rejected").slice(0, 12);

  const openNew = (p?: Partial<RewardInput>) => {
    setEditing(null);
    setPreset(p ?? null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setLibraryOpen(true)}>
          <LibraryIcon />
          Reward ideas
        </Button>
        <Button onClick={() => openNew()}>
          <PlusIcon />
          New reward
        </Button>
      </div>

      {open.length ? (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg font-semibold">To deliver</h2>
          <ul className="space-y-2">
            {open.map((r) => {
              const reward = rewardMap.get(r.reward_id);
              const kid = kidMap.get(r.child_id);
              const key = `red-${r.id}`;
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
                  {kid ? <KidAvatar avatar={kid.avatar} color={kid.color} size="sm" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <span className="font-medium">{kid?.name}</span> <span className="text-muted-foreground">redeemed</span>{" "}
                      <span className="font-medium">
                        {reward?.icon} {reward?.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {timeAgo(r.requested_at)} · {r.cost_at_time} {family.currency_emoji} ·{" "}
                      <span className="capitalize">{r.status === "pending" ? "awaiting approval" : "approved, not delivered"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.status === "pending" ? (
                      <Button size="sm" variant="outline" disabled={isBusy(key)} onClick={() => run(() => resolveRedemption(r.id, "reject"), { key })}>
                        <XIcon /> Decline
                      </Button>
                    ) : null}
                    <Button size="sm" disabled={isBusy(key)} onClick={() => run(() => resolveRedemption(r.id, "fulfill"), { key })}>
                      <PackageCheckIcon /> Delivered
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

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

      {history.length ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-muted-foreground">Recent history</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {history.map((r) => {
              const reward = rewardMap.get(r.reward_id);
              const kid = kidMap.get(r.child_id);
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  {kid ? <KidAvatar avatar={kid.avatar} color={kid.color} size="xs" /> : null}
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{kid?.name}</span> · {reward?.icon} {reward?.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.resolved_at ?? r.requested_at)}</span>
                  <Badge variant={r.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                    {r.status === "fulfilled" ? "delivered" : r.status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <RewardDialog open={dialogOpen} onOpenChange={setDialogOpen} reward={editing} preset={preset} family={family} />

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
                  <span className="text-2xl">{t.icon}</span>
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
  hidden,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  reward: Reward;
  family: Family;
  hidden?: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const soldOut = reward.stock !== null && reward.stock <= 0;
  return (
    <li className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm", hidden && "opacity-60")}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">{reward.icon}</span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="block truncate text-left font-medium hover:underline">
            {reward.title}
          </button>
          <div className="text-xs text-muted-foreground capitalize">
            {reward.category}
            {reward.stock !== null ? ` · ${soldOut ? "sold out" : `${reward.stock} left`}` : ""}
          </div>
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
        <Badge className="bg-sun-300/50 text-foreground hover:bg-sun-300/50">
          {reward.cost} {family.currency_emoji}
        </Badge>
      </div>
    </li>
  );
}
