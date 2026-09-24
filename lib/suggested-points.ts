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

/** Cash rewards: 500 points ≈ $10. Privileges stay cheaper on their own scale. */
export const POINTS_PER_DOLLAR = 50;

export function dollarsToPoints(dollars: number) {
  return Math.max(0, Math.round(dollars * POINTS_PER_DOLLAR));
}

/** If the title names a dollar amount, suggest that many points. */
export function suggestRewardCost(title: string, fallback = 50) {
  const m = title.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (m) return dollarsToPoints(Number.parseFloat(m[1]));
  return fallback;
}

export const CASH_STEP_DOLLARS = 5;
export const CASH_MAX_DOLLARS = 50;

export function isCashReward(title: string, description?: string | null) {
  return /\$/.test(title) || /\$/.test(description ?? "");
}

export function pointsToDollars(points: number) {
  return points / POINTS_PER_DOLLAR;
}

export function formatDollars(dollars: number) {
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** Listed $ from the name, plus an optional "up to $N" cap. */
export function parseCashAmounts(title: string, description?: string | null) {
  const text = `${title} ${description ?? ""}`;
  const matches = [...text.matchAll(/\$\s*(\d+(?:\.\d+)?)/g)].map((m) => Number.parseFloat(m[1]));
  const listed = matches[0] ?? CASH_STEP_DOLLARS;
  const upTo = text.match(/up to\s*\$\s*(\d+(?:\.\d+)?)/i);
  const cap = upTo ? Number.parseFloat(upTo[1]) : CASH_MAX_DOLLARS;
  const snapped = Math.max(CASH_STEP_DOLLARS, Math.round(listed / CASH_STEP_DOLLARS) * CASH_STEP_DOLLARS);
  const max = Math.max(CASH_STEP_DOLLARS, Math.round(cap / CASH_STEP_DOLLARS) * CASH_STEP_DOLLARS);
  return { listed: Math.min(snapped, max), cap: max };
}

export function cashStepOptions(title: string, description: string | null | undefined, balance: number) {
  const { listed, cap } = parseCashAmounts(title, description);
  const affordableMax = Math.floor(balance / POINTS_PER_DOLLAR / CASH_STEP_DOLLARS) * CASH_STEP_DOLLARS;
  const options: { dollars: number; points: number; affordable: boolean }[] = [];
  for (let d = CASH_STEP_DOLLARS; d <= cap; d += CASH_STEP_DOLLARS) {
    options.push({ dollars: d, points: dollarsToPoints(d), affordable: d <= affordableMax });
  }
  const defaultDollars = options.some((o) => o.dollars === listed && o.affordable)
    ? listed
    : options.filter((o) => o.affordable).at(-1)?.dollars ?? listed;
  return { options, defaultDollars, minPoints: dollarsToPoints(CASH_STEP_DOLLARS) };
}

/** Parent/kid labels: "$10 · 500 🪙" for cash, otherwise just points. */
export function formatSpend(points: number, emoji: string, title?: string, description?: string | null) {
  if (title != null && isCashReward(title, description)) {
    return `${formatDollars(pointsToDollars(points))} · ${points} ${emoji}`;
  }
  return `${points} ${emoji}`;
}
