import { formatDistanceToNowStrict, format, parseISO } from "date-fns";

export function timeAgo(iso: string) {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function shortDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function longDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEEE, MMMM d");
  } catch {
    return dateStr;
  }
}

export function dateTime(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, h:mm a");
  } catch {
    return iso;
  }
}

export function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function pluralize(n: number, singular: string, plural = singular + "s") {
  return n === 1 ? singular : plural;
}
