"use client";

import { PackageCheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChildLookAvatar, ChildLookName } from "@/components/shared/child-look";
import { RewardIcon } from "@/components/shared/reward-icon";
import { useAction } from "@/hooks/use-action";
import { resolveRedemption } from "@/lib/actions/rewards";
import { timeAgo } from "@/lib/format";
import { formatSpend } from "@/lib/suggested-points";
import type { Child, Family, Reward, RewardRedemption } from "@/types/database";

function statusLabel(status: RewardRedemption["status"]) {
  if (status === "pending") return "awaiting approval";
  if (status === "approved") return "bought, not handed out";
  if (status === "fulfilled") return "delivered";
  return status;
}

export function RewardPurchases({
  redemptions,
  rewards,
  kids,
  family,
  empty,
}: {
  redemptions: RewardRedemption[];
  rewards: Reward[];
  kids: Child[];
  family: Family;
  empty?: string;
}) {
  const { run, isBusy } = useAction();
  const kidMap = new Map(kids.map((k) => [k.id, k]));
  const rewardMap = new Map(rewards.map((r) => [r.id, r]));
  const open = redemptions.filter((r) => r.status === "pending" || r.status === "approved");
  const past = redemptions.filter((r) => r.status === "fulfilled" || r.status === "rejected");

  if (!open.length && !past.length) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {empty ?? "When a kid buys a reward, it shows up here so you can mark it delivered."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">To deliver</h2>
        {open.length ? (
          <ul className="space-y-2">
            {open.map((r) => {
              const reward = rewardMap.get(r.reward_id);
              const kid = kidMap.get(r.child_id);
              const key = `red-${r.id}`;
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
                  {kid ? <ChildLookAvatar child={kid} size="sm" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <span className="font-medium">{kid ? <ChildLookName child={kid} /> : "Someone"}</span>{" "}
                      <span className="text-muted-foreground">{r.fund_id ? "helped fill" : "bought"}</span>{" "}
                      <span className="font-medium">
                        <RewardIcon icon={reward?.icon} className="size-5" /> {reward?.title ?? "a reward"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {timeAgo(r.requested_at)} · {formatSpend(r.cost_at_time, family.currency_emoji, reward?.title, reward?.description)}
                      {r.fund_id ? " · shared pot" : ""} · {statusLabel(r.status)}
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
        ) : (
          <p className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">Nothing waiting to be handed out.</p>
        )}
      </section>

      {past.length ? (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-muted-foreground">Purchase history</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {past.map((r) => {
              const reward = rewardMap.get(r.reward_id);
              const kid = kidMap.get(r.child_id);
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  {kid ? <ChildLookAvatar child={kid} size="xs" /> : null}
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{kid ? <ChildLookName child={kid} /> : "Someone"}</span>
                    {" · "}
                    <RewardIcon icon={reward?.icon} className="size-4" /> {reward?.title ?? "Reward"}
                    {r.fund_id ? <span className="text-muted-foreground"> · shared pot</span> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.resolved_at ?? r.requested_at)}</span>
                  <Badge variant={r.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                    {statusLabel(r.status)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
