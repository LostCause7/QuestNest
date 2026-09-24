import type { Metadata } from "next";
import { Closet } from "@/components/kid/closet";
import { KidPageHero } from "@/components/kid/page-hero";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild } from "@/lib/data/kid";
import { familyToday, getApprovedCounts, getBadges, getChildGifts, getFamilyMilestones } from "@/lib/data/parent";
import { seasonWindow } from "@/lib/cosmetics";

export const metadata: Metadata = { title: "Closet" };

export default async function KidClosetPage(props: PageProps<"/kids/[childId]/closet">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const today = familyToday(family);
  const season = seasonWindow(family.created_at, today);
  const [extras, badges, gifts, counts] = await Promise.all([
    getFamilyMilestones(family.id),
    getBadges([child.id]),
    getChildGifts(child.id),
    getApprovedCounts(family.id, season.from, today),
  ]);

  return (
    <>
      <KidPageHero
        emoji="👕"
        title="Closet"
        subtitle={`Dress up your nest self. Nothing here costs ${family.currency_name.toLowerCase()}.`}
      />
      <Closet
        key={child.id}
        child={child}
        family={family}
        extras={extras}
        badges={badges}
        gifts={gifts}
        lockedSlots={family.style?.lockedSlots ?? []}
        seasonQuests={counts[child.id] ?? 0}
      />
    </>
  );
}
