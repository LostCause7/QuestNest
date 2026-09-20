import { KidAvatar } from "@/components/shared/avatar-picker";
import { EmptyState } from "@/components/parent/page-header";
import { dateTime, signed } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Child, Family, PointTransaction, TxKind } from "@/types/database";

const KIND_LABEL: Record<TxKind, { label: string; emoji: string }> = {
  chore: { label: "Quest", emoji: "⚔️" },
  reward: { label: "Reward", emoji: "🎁" },
  refund: { label: "Refund", emoji: "↩️" },
  bonus: { label: "Bonus", emoji: "🌟" },
  penalty: { label: "Deduction", emoji: "⚠️" },
  adjustment: { label: "Adjustment", emoji: "🛠️" },
};

export function ActivityList({
  transactions,
  kids,
  family,
  compact,
}: {
  transactions: PointTransaction[];
  kids: Child[];
  family: Family;
  compact?: boolean;
}) {
  if (!transactions.length) {
    return (
      <EmptyState
        icon="📜"
        title="No activity yet"
        description="Every approved quest, reward, bonus and deduction shows up here."
        className={compact ? "py-8" : undefined}
      />
    );
  }
  const kidMap = new Map(kids.map((c) => [c.id, c]));
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {transactions.map((t) => {
        const kid = kidMap.get(t.child_id);
        const meta = KIND_LABEL[t.kind];
        const positive = t.amount > 0;
        return (
          <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
            {kid ? <KidAvatar avatar={kid.avatar} color={kid.color} size="xs" /> : <span className="size-8" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                <span className="font-medium">{kid?.name ?? "Kid"}</span>{" "}
                <span className="text-muted-foreground">
                  {meta.emoji} {t.note ?? meta.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {meta.label} · {dateTime(t.created_at)}
              </div>
            </div>
            <div
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
                positive ? "bg-mint-300/50 text-emerald-800" : "bg-rose-100 text-rose-700"
              )}
            >
              {signed(t.amount)} {family.currency_emoji}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
