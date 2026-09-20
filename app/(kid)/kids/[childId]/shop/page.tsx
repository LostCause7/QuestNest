import type { Metadata } from "next";
import { Shop } from "@/components/kid/shop";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild } from "@/lib/data/kid";
import { getRewards, getRedemptions } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Reward shop" };

export default async function KidShopPage(props: PageProps<"/kids/[childId]/shop">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const [rewards, redemptions] = await Promise.all([getRewards(family.id), getRedemptions(family.id, ["pending", "approved"], 50)]);
  const visible = rewards.filter((r) => r.is_active).sort((a, b) => a.cost - b.cost);
  const mine = redemptions.filter((r) => r.child_id === child.id);
  return <Shop rewards={visible} child={child} family={family} openRedemptions={mine} />;
}
