import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/parent/page-header";
import { RewardsManager } from "@/components/parent/rewards-manager";
import { ManagerFallback } from "@/components/parent/manager-fallback";
import { requireFamily } from "@/lib/data/family";
import { getChildren, getOpenRedemptions, getRewardFunds, getRewards, getRedemptions } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const family = await requireFamily();
  const [rewards, openRedemptions, redemptions, kids, funds] = await Promise.all([
    getRewards(family.id),
    getOpenRedemptions(family.id),
    getRedemptions(family.id, undefined, 80),
    getChildren(family.id, true),
    getRewardFunds(family.id),
  ]);
  return (
    <>
      <PageHeader
        title="Reward shop"
        description={`Purchases to hand out, plus everything your kids can spend their ${family.currency_name.toLowerCase()} on.`}
      />
      <Suspense fallback={<ManagerFallback />}>
        <RewardsManager
          rewards={rewards}
          redemptions={[...openRedemptions, ...redemptions.filter((r) => r.status === "fulfilled" || r.status === "rejected")]}
          kids={kids}
          family={family}
          funds={funds}
        />
      </Suspense>
    </>
  );
}
