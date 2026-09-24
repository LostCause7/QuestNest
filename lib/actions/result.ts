import { isNextRedirect } from "@/lib/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail<T = undefined>(error: string): ActionResult<T> {
  return { ok: false, error };
}

/** Translate raw Postgres/PostgREST errors into friendly copy. */
export function friendlyError(message: string) {
  if (/duplicate key.*chore_completions/i.test(message)) return "That quest is already checked off for today.";
  if (/already claimed today/i.test(message)) return "A sibling already claimed that quest today.";
  if (/not enough points/i.test(message)) return "Not enough points for that reward yet.";
  if (/amount must be in \$5 steps/i.test(message)) return "Pick an amount in $5 steps.";
  if (/that amount is too big/i.test(message)) return "That's more than this reward allows.";
  if (/pick an amount/i.test(message)) return "Pick how many dollars you want.";
  if (/out of stock/i.test(message)) return "That reward is sold out.";
  if (/already reviewed/i.test(message)) return "That one was already reviewed.";
  if (/PIN must be/i.test(message)) return message.replace(/^.*?PIN/, "PIN");
  if (/not allowed/i.test(message)) return "You don't have permission to do that.";
  if (/row-level security/i.test(message)) return "You don't have permission to do that.";
  if (/tx_kind|expression is of type text/i.test(message)) return "Couldn't apply that bonus or deduction. Try again.";
  return message;
}

/** Keep server actions from throwing raw errors (those become a broken Next response). */
export async function guardAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return fail(friendlyError(message));
  }
}
