import type { Metadata } from "next";
import { QuestBoard } from "@/components/kid/quest-board";
import { KindnessMeter, KudosNotes, MissedMandatory, SaveUpMeter } from "@/components/kid/home-extras";
import { requireFamily } from "@/lib/data/family";
import { requireActiveChild, getQuestBoard } from "@/lib/data/kid";
import { familyToday, getChores, getKindnessCount, getRecentKudos, getRecentMisses, getRewards, shiftDate } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Today's quests" };

export default async function KidQuestsPage(props: PageProps<"/kids/[childId]">) {
  const { childId } = await props.params;
  const family = await requireFamily();
  const child = await requireActiveChild(family, childId);
  const today = familyToday(family);
  const [{ cards, tomorrowPeek, takenToday }, kudos, kindness, rewards, misses, chores] = await Promise.all([
    getQuestBoard(family, child),
    getRecentKudos(child.id),
    getKindnessCount(child.id),
    child.style?.savingFor ? getRewards(family.id) : Promise.resolve([]),
    getRecentMisses(child.id, shiftDate(today, -6), shiftDate(today, -1)),
    getChores(family.id),
  ]);
  const goal = child.style?.savingFor ? rewards.find((r) => r.id === child.style?.savingFor && r.is_active) ?? null : null;
  const missTitles = Object.fromEntries(chores.map((c) => [c.id, c.title]));

  return (
    <>
      <KudosNotes kudos={kudos} />
      <MissedMandatory misses={misses} titles={missTitles} currencyEmoji={family.currency_emoji} />
      <KindnessMeter count={kindness} />
      <SaveUpMeter reward={goal} balance={child.points_balance} currencyEmoji={family.currency_emoji} childId={child.id} />
      <QuestBoard cards={cards} family={family} child={child} today={today} tomorrowPeek={tomorrowPeek} takenToday={takenToday} />
    </>
  );
}
