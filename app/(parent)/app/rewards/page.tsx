import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/parent/page-header";
import { RewardsManager } from "@/components/parent/rewards-manager";
import { requireFamily } from "@/lib/data/family";
import { getChildren, getRewards, getRedemptions } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const family = await requireFamily();
  const [rewards, redemptions, kids] = await Promise.all([
    getRewards(family.id),
    getRedemptions(family.id, undefined, 60),
    getChildren(family.id, true),
  ]);
  return (
    <>
      <PageHeader title="Reward shop" description={`Everything your kids can spend their ${family.currency_name.toLowerCase()} on.`} />
      <Suspense>
        <RewardsManager rewards={rewards} redemptions={redemptions} kids={kids} family={family} />
      </Suspense>
    </>
  );
}
