"use client";

import { CheckIcon, XIcon, PackageCheckIcon, Loader2Icon, InboxIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { EmptyState } from "@/components/parent/page-header";
import { useAction } from "@/hooks/use-action";
import { reviewCompletion } from "@/lib/actions/chores";
import { resolveRedemption } from "@/lib/actions/rewards";
import { timeAgo, longDate } from "@/lib/format";
import type { Child, Chore, ChoreCompletion, Reward, RewardRedemption, Family } from "@/types/database";

export type PendingItem =
  | { kind: "completion"; item: ChoreCompletion; chore: Chore | undefined; child: Child | undefined }
  | { kind: "redemption"; item: RewardRedemption; reward: Reward | undefined; child: Child | undefined };

export function ApprovalQueue({ items, family }: { items: PendingItem[]; family: Family }) {
  const { run, isBusy } = useAction();

  if (!items.length) {
    return (
      <EmptyState icon={<InboxIcon className="size-7 text-primary" />} title="All caught up" description="Nothing is waiting for your approval. Quests and reward requests will show up here." className="py-10" />
    );
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((p) => {
          const key = `${p.kind}-${p.item.id}`;
          const busy = isBusy(key);
          return (
            <motion.li
              key={key}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center"
            >
              {p.child ? <KidAvatar avatar={p.child.avatar} color={p.child.color} size="sm" /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">{p.child?.name ?? "Someone"}</span>
                  <span className="text-muted-foreground">
                    {p.kind === "completion" ? "finished" : "wants"}
                  </span>
                  <span className="font-medium">
                    {p.kind === "completion" ? (
                      <>
                        {p.chore?.icon} {p.chore?.title ?? "a quest"}
                      </>
                    ) : (
                      <>
                        {p.reward?.icon} {p.reward?.title ?? "a reward"}
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.kind === "completion"
                    ? `${longDate(p.item.for_date)} · submitted ${timeAgo(p.item.completed_at)}`
                    : `requested ${timeAgo(p.item.requested_at)} · ${p.item.cost_at_time} ${family.currency_emoji} held`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.kind === "completion" ? (
                  <>
                    <span className="mr-1 rounded-full bg-sun-300/40 px-2.5 py-1 text-sm font-semibold">
                      +{p.chore?.points ?? 0} {family.currency_emoji}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => run(() => reviewCompletion(p.item.id, false), { key })}
                    >
                      <XIcon />
                      Not yet
                    </Button>
                    <Button size="sm" disabled={busy} onClick={() => run(() => reviewCompletion(p.item.id, true), { key })}>
                      {busy ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                      Approve
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => run(() => resolveRedemption(p.item.id, "reject"), { key })}
                    >
                      <XIcon />
                      Decline
                    </Button>
                    <Button size="sm" disabled={busy} onClick={() => run(() => resolveRedemption(p.item.id, "fulfill"), { key })}>
                      {busy ? <Loader2Icon className="animate-spin" /> : <PackageCheckIcon />}
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
