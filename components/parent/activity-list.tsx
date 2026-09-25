import { EmptyState } from "@/components/parent/page-header";
import { ActivityRows } from "@/components/parent/activity-rows";
import type { Child, Family, PointTransaction } from "@/types/database";

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
  const rows = transactions.map((t) => {
    const kid = kidMap.get(t.child_id);
    return {
      id: t.id,
      childName: kid?.name ?? "Kid",
      avatar: kid?.avatar ?? "luna",
      color: kid?.color ?? "sky",
      kind: t.kind,
      note: t.note,
      amount: t.amount,
      createdAt: t.created_at,
    };
  });
  return <ActivityRows rows={rows} currencyEmoji={family.currency_emoji} compact={compact} />;
}