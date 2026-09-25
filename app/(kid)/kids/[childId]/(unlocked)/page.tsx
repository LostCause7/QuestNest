import type { Metadata } from "next";
import { QuestBoard } from "@/components/kid/quest-board";
import { KindnessMeter, KudosNotes, SaveUpMeter } from "@/components/kid/home-extras";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild, getQuestBoard } from "@/lib/data/kid";
import { familyToday, getKindnessCount, getRecentKudos, getRewards } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Today's quests" };

export default async function KidQuestsPage(props: PageProps<"/kids/[childId]">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const today = familyToday(family);
  const [{ cards, tomorrowPeek, takenToday }, kudos, kindness, rewards] = await Promise.all([
    getQuestBoard(family, child),
    getRecentKudos(child.id, family.timezone),
    getKindnessCount(child.id),
    child.style?.savingFor ? getRewards(family.id) : Promise.resolve([]),
  ]);
  const goal = child.style?.savingFor ? rewards.find((r) => r.id === child.style?.savingFor && r.is_active) ?? null : null;

  return (
    <>
      <KudosNotes kudos={kudos} />
      <KindnessMeter count={kindness} />
      <SaveUpMeter reward={goal} balance={child.points_balance} currencyEmoji={family.currency_emoji} childId={child.id} />
      <QuestBoard cards={cards} family={family} child={child} today={today} tomorrowPeek={tomorrowPeek} takenToday={takenToday} />
    </>
  );
}
