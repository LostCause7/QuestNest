import type { Chore, ChoreCompletion } from "@/types/database";

export const WEEKDAYS = [
  { value: 0, short: "Sun", long: "Sunday" },
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
];

/** Local hour (0-23) and minute in the given IANA timezone. */
export function clockInTimezone(timezone: string, now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { hour: get("hour"), minute: get("minute") };
  } catch {
    return { hour: now.getHours(), minute: now.getMinutes() };
  }
}

/**
 * Day to settle mandatory misses, or null if it is not time yet.
 * 11:50pm–midnight: today. Midnight–noon: yesterday (if nobody was on at 11:50).
 * Afternoon: do not check.
 */
export function mandatorySettleThrough(timezone: string, now = new Date()): string | null {
  const today = todayInTimezone(timezone, now);
  const { hour, minute } = clockInTimezone(timezone, now);
  const mins = hour * 60 + minute;
  if (mins >= 23 * 60 + 50) return today;
  if (mins < 12 * 60) {
    const [y, m, d] = today.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  }
  return null;
}

/** YYYY-MM-DD for "today" in the given IANA timezone. */
export function todayInTimezone(timezone: string, now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** 0-6 (Sunday = 0) weekday for a YYYY-MM-DD date string. */
export function weekdayOf(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Whether a chore is scheduled on the given date. */
export function isChoreDueOn(chore: Pick<Chore, "recurrence" | "days_of_week" | "is_active">, dateStr: string) {
  if (!chore.is_active) return false;
  switch (chore.recurrence) {
    case "daily":
      return true;
    case "once":
      return true; // a one-off shows until it's completed (handled by caller)
    case "weekly":
    case "custom":
      return chore.days_of_week.includes(weekdayOf(dateStr));
    default:
      return true;
  }
}

export function describeSchedule(chore: Pick<Chore, "recurrence" | "days_of_week">) {
  if (chore.recurrence === "daily") return "Every day";
  if (chore.recurrence === "once") return "One time";
  const days = [...chore.days_of_week].sort();
  if (days.length === 7) return "Every day";
  if (days.length === 0) return "Not scheduled";
  if (days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.join(",") === "0,6") return "Weekends";
  return days.map((d) => WEEKDAYS[d]?.short).join(", ");
}

export type QuestStatus = "todo" | "pending" | "approved" | "rejected" | "excused";

/** Derive the status of a chore for a child on a date from the completions list. */
export function questStatus(
  choreId: string,
  childId: string,
  dateStr: string,
  completions: Pick<ChoreCompletion, "chore_id" | "child_id" | "for_date" | "status">[]
): QuestStatus {
  const c = completions.find(
    (x) => x.chore_id === choreId && x.child_id === childId && x.for_date === dateStr
  );
  if (!c) return "todo";
  return c.status;
}

export function isSkipRequest(row: Pick<ChoreCompletion, "status" | "excuse"> | { status: string; excuse?: boolean | null }) {
  return Boolean(row.excuse) || row.status === "excused";
}

export function isActiveClaim(row: Pick<ChoreCompletion, "status" | "excuse"> | { status: string; excuse?: boolean | null }) {
  if (isSkipRequest(row)) return false;
  return row.status === "pending" || row.status === "approved";
}

/** When `single_claim` is on, the sibling who already holds today's slot (if any). */
export function siblingClaim<T extends Pick<ChoreCompletion, "chore_id" | "child_id" | "for_date" | "status"> & { excuse?: boolean | null }>(
  chore: Pick<Chore, "id" | "single_claim">,
  childId: string,
  dateStr: string,
  completions: T[]
): T | undefined {
  if (!chore.single_claim) return undefined;
  return completions.find((x) => x.chore_id === chore.id && x.child_id !== childId && x.for_date === dateStr && isActiveClaim(x));
}
