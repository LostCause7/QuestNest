import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/parent/page-header";
import { ActivityList } from "@/components/parent/activity-list";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { requireFamily } from "@/lib/data/family";
import { getChildren, getTransactions } from "@/lib/data/parent";
import { cn } from "@/lib/utils";
import { CsvExportButton, PrintButton } from "@/components/parent/nest-extras";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage(props: PageProps<"/app/activity">) {
  const sp = await props.searchParams;
  const kidId = typeof sp.kid === "string" ? sp.kid : undefined;
  const family = await requireFamily();
  const [kids, transactions] = await Promise.all([
    getChildren(family.id, true),
    getTransactions(family.id, { childId: kidId, limit: 200 }),
  ]);

  const earned = transactions.filter((t) => t.amount > 0 && t.kind !== "refund").reduce((s, t) => s + t.amount, 0);
  const spent = transactions.filter((t) => t.kind === "reward").reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <>
      <PageHeader title="Activity" description="The full ledger - every point earned, spent, refunded or adjusted.">
        <CsvExportButton rows={transactions} filename="questnest-ledger.csv" />
        <PrintButton label="Print" />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip href="/app/activity" active={!kidId}>
          Everyone
        </FilterChip>
        {kids.map((k) => (
          <FilterChip key={k.id} href={`/app/activity?kid=${k.id}`} active={kidId === k.id}>
            <KidAvatar avatar={k.avatar} color={k.color} size="xs" className="size-5 text-xs" />
            {k.name}
          </FilterChip>
        ))}
        <div className="ml-auto text-sm text-muted-foreground">
          <span className="font-medium text-emerald-700">+{earned}</span> earned ·{" "}
          <span className="font-medium text-rose-700">-{spent}</span> spent (last {transactions.length})
        </div>
      </div>

      <ActivityList transactions={transactions} kids={kids} family={family} />
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
    >
      {children}
    </Link>
  );
}
