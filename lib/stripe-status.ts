export const LIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function nestIsSubscribed(status?: string | null) {
  return Boolean(status && LIVE_STATUSES.has(status));
}
