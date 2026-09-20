import type { Metadata } from "next";
import { QuestBoard } from "@/components/kid/quest-board";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild, getQuestBoard } from "@/lib/data/kid";

export const metadata: Metadata = { title: "Today's quests" };

export default async function KidQuestsPage(props: PageProps<"/kids/[childId]">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const { today, cards } = await getQuestBoard(family, child);
  return <QuestBoard cards={cards} family={family} child={child} today={today} />;
}
