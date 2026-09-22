/** Local heuristic — no API. Parents can still type any number. */
export function suggestQuestPoints(title: string) {
  const t = title.toLowerCase();
  if (!t.trim()) return 10;
  if (/(vacuum|mow|laundry|dishwasher|cook|homework|study)/.test(t)) return 25;
  if (/(trash|recycle|walk the dog|bathroom|shower)/.test(t)) return 15;
  if (/(brush|dress|hamper|make your bed|read)/.test(t)) return 5;
  if (/(tidy|clean|feed|table|water)/.test(t)) return 10;
  return 10;
}
