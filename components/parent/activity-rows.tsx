"use client";

import { useState } from "react";
import { Undo2Icon } from "lucide-react";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import { useAction } from "@/hooks/use-action";
import { undoTransaction } from "@/lib/actions/children";
import { dateTime, signed } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TxKind } from "@/types/database";

const KIND_LABEL: Record<TxKind, { label: string; emoji: string }> = {
  chore: { label: "Quest", emoji: "⚔️" },
  reward: { label: "Reward", emoji: "🎁" },
  refund: { label: "Refund", emoji: "↩️" },
  bonus: { label: "Bonus", emoji: "🌟" },
  penalty: { label: "Deduction", emoji: "⚠️" },
  adjustment: { label: "Adjustment", emoji: "🛠️" },
};

export type ActivityRow = {
  id: string;
  childName: string;
  avatar: string;
  color: string;
  kind: TxKind;
  note: string | null;
  amount: number;
  createdAt: string;
};

export function ActivityRows({
  rows,
  currencyEmoji,
  compact,
}: {
  rows: ActivityRow[];
  currencyEmoji: string;
  compact?: boolean;
}) {
  const { run, pending } = useAction();
  const [undoId, setUndoId] = useState<string | null>(null);

  return (
    <>
      <ul className="divide-y rounded-2xl border bg-card">
        {rows.map((t) => {
          const meta = KIND_LABEL[t.kind];
          const positive = t.amount > 0;
          return (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <KidAvatar avatar={t.avatar} color={t.color} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">
                  <span className="font-medium">{t.childName}</span>{" "}
                  <span className="text-muted-foreground">
                    {meta.emoji} {t.note ?? meta.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {meta.label} · {dateTime(t.createdAt)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div
                  className={cn(
                    "rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
                    positive ? "bg-mint-300/50 text-emerald-800" : "bg-rose-100 text-rose-700"
                  )}
                >
                  {signed(t.amount)} {currencyEmoji}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size={compact ? "xs" : "sm"}
                  className="text-muted-foreground"
                  disabled={pending}
                  onClick={() => setUndoId(t.id)}
                >
                  <Undo2Icon />
                  Undo
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={undoId != null}
        onOpenChange={(open) => {
          if (!open) setUndoId(null);
        }}
        title="Undo this activity?"
        description="This removes it from Activity and puts the points back."
        confirmLabel="Undo"
        destructive={false}
        pending={pending}
        onConfirm={() => {
          if (!undoId) return;
          void run(() => undoTransaction(undoId), {
            key: undoId,
            onSuccess: () => setUndoId(null),
          });
        }}
      />
    </>
  );
}