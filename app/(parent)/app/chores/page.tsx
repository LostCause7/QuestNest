import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/parent/page-header";
import { ChoresManager } from "@/components/parent/chores-manager";
import { ManagerFallback } from "@/components/parent/manager-fallback";
import { requireFamily } from "@/lib/data/family";
import { getChildren, getChores } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Quests" };

export default async function ChoresPage() {
  const family = await requireFamily();
  const [chores, kids] = await Promise.all([getChores(family.id), getChildren(family.id)]);
  return (
    <>
      <PageHeader title="Quests" description="Chores, routines and responsibilities. Set the value, the schedule and who does what." />
      <Suspense fallback={<ManagerFallback />}>
        <ChoresManager chores={chores} kids={kids} family={family} />
      </Suspense>
    </>
  );
}
