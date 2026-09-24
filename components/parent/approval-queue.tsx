"use client";

import { useEffect, useState } from "react";
import { CheckIcon, XIcon, PackageCheckIcon, Loader2Icon, InboxIcon, Undo2Icon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { EmptyState } from "@/components/parent/page-header";
import { useAction } from "@/hooks/use-action";
import { reviewCompletion } from "@/lib/actions/chores";
import { resolveRedemption } from "@/lib/actions/rewards";
import { timeAgo, longDate } from "@/lib/format";
import { formatSpend } from "@/lib/suggested-points";
import { play } from "@/lib/sound";
import type { Child, Chore, ChoreCompletion, Reward, RewardRedemption, Family } from "@/types/database";

export type PendingItem =
  | { kind: "completion"; item: ChoreCompletion; chore: Chore | undefined; child: Child | undefined }
  | { kind: "redemption"; item: RewardRedemption; reward: Reward | undefined; child: Child | undefined };

export function ApprovalQueue({ items, family }: { items: PendingItem[]; family: Family }) {
  const { run, isBusy } = useAction();
  const [sendBackId, setSendBackId] = useState<string | null>(null);
  const [sendBackNote, setSendBackNote] = useState("");
  const [stamped, setStamped] = useState<string | null>(null);

  const approve = (p: PendingItem, key: string) => {
    setStamped(key);
    play("stamp");
    const fn = p.kind === "completion" ? () => reviewCompletion(p.item.id, true) : () => resolveRedemption(p.item.id, "fulfill");
    // Let the stamp land before the row leaves.
    setTimeout(() => void run(fn, { key, onSuccess: () => setStamped(null) }), 350);
  };

  const completions = items.filter((p) => p.kind === "completion");
  const byKid = new Map<string, PendingItem[]>();
  for (const p of completions) {
    const id = p.child?.id ?? "unknown";
    byKid.set(id, [...(byKid.get(id) ?? []), p]);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const first = items[0];
      if (!first) return;
      const key = `${first.kind}-${first.item.id}`;
      if (e.key === "a" || e.key === "A") approve(first, key);
      if ((e.key === "n" || e.key === "N") && first.kind === "completion") {
        setSendBackId(first.item.id);
        setSendBackNote("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, run]);

  if (!items.length) {
    return (
      <EmptyState icon={<InboxIcon className="size-7 text-primary" />} title="All caught up" description="Nothing is waiting for your approval. Quests and reward requests will show up here." className="py-10" />
    );
  }

  return (
    <div className="space-y-3">
      {completions.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-xs text-muted-foreground">Keyboard: A approve · N send back the top item</p>
          {[...byKid.entries()].map(([id, list]) => {
            const name = list[0]?.child?.name ?? "this kid";
            return (
              <Button
                key={id}
                size="sm"
                variant="outline"
                className="min-h-11"
                disabled={list.some((p) => isBusy(`${p.kind}-${p.item.id}`))}
                onClick={() => {
                  for (const p of list) {
                    if (p.kind === "completion") run(() => reviewCompletion(p.item.id, true), { key: `${p.kind}-${p.item.id}` });
                  }
                }}
              >
                Approve all for {name}
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Keyboard: A approve · N send back</p>
      )}
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
              className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-3"
            >
              {stamped === key ? (
                <span
                  aria-hidden="true"
                  className="qn-stamp pointer-events-none absolute top-2 right-3 z-10 rounded-lg border-[3px] border-emerald-600 px-2 py-0.5 font-display text-lg font-black uppercase tracking-widest text-emerald-600"
                >
                  {p.kind === "completion" && p.item.excuse ? "That's okay" : "Approved"}
                </span>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {p.child ? <KidAvatar avatar={p.child.avatar} color={p.child.color} size="sm" /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-medium">{p.child?.name ?? "Someone"}</span>
                  <span className="text-muted-foreground">
                    {p.kind === "completion" ? (p.item.excuse ? "can't do" : "finished") : "wants"}
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
                    : `requested ${timeAgo(p.item.requested_at)} · ${formatSpend(p.item.cost_at_time, family.currency_emoji, p.reward?.title, p.reward?.description)} held`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.kind === "completion" ? (
                  <>
                    {p.item.excuse ? (
                      <span className="mr-1 rounded-full bg-sky-100 px-2.5 py-1 text-sm font-semibold text-sky-800">
                        Skip today
                      </span>
                    ) : (
                      <span className="mr-1 rounded-full bg-sun-300/40 px-2.5 py-1 text-sm font-semibold">
                        +{p.chore?.points ?? 0} {family.currency_emoji}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 px-3"
                      disabled={busy}
                      onClick={() => {
                        setSendBackId(p.item.id);
                        setSendBackNote("");
                      }}
                    >
                      <XIcon />
                      {p.item.excuse ? "Still needs doing" : "Not yet"}
                    </Button>
                    <Button size="sm" className="min-h-11 px-3" disabled={busy || stamped === key} onClick={() => approve(p, key)}>
                      {busy ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                      {p.item.excuse ? "That's okay" : "Approve"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 px-3"
                      disabled={busy}
                      onClick={() => run(() => resolveRedemption(p.item.id, "reject"), { key })}
                    >
                      <XIcon />
                      Decline
                    </Button>
                    <Button size="sm" className="min-h-11 px-3" disabled={busy || stamped === key} onClick={() => approve(p, key)}>
                      {busy ? <Loader2Icon className="animate-spin" /> : <PackageCheckIcon />}
                      Approve
                    </Button>
                  </>
                )}
              </div>
              </div>
              {p.kind === "completion" && sendBackId === p.item.id ? (
                <div className="space-y-2 rounded-xl bg-muted/60 p-3">
                  <Textarea
                    value={sendBackNote}
                    onChange={(e) => setSendBackNote(e.target.value)}
                    placeholder={
                      items.find((x) => x.kind === "completion" && x.item.id === sendBackId && x.item.excuse)
                        ? "Optional note (why they still need to do it)"
                        : "Optional note for your kid (what to fix, try again, etc.)"
                    }
                    maxLength={280}
                    className="min-h-20 bg-background"
                    autoFocus
                  />
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        setSendBackId(null);
                        setSendBackNote("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(() => reviewCompletion(p.item.id, false, undefined, sendBackNote), {
                          key,
                          onSuccess: () => {
                            setSendBackId(null);
                            setSendBackNote("");
                          },
                        })
                      }
                    >
                      {busy ? <Loader2Icon className="animate-spin" /> : <Undo2Icon />}
                      Send back
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
    </div>
  );
}
