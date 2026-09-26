import Stripe from "stripe";

export { nestIsSubscribed, LIVE_STATUSES } from "@/lib/stripe-status";

export function getStripeSecret() {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

export function getStripePriceId() {
  return process.env.STRIPE_PRICE_ID?.trim() || "";
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
}

export function isBillingConfigured() {
  return Boolean(getStripeSecret() && getStripePriceId());
}

let stripe: Stripe | null = null;

export function getStripe() {
  const key = getStripeSecret();
  if (!key) return null;
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function subscriptionPeriodEnd(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0];
  const fromItem =
    item && "current_period_end" in item && typeof item.current_period_end === "number"
      ? item.current_period_end
      : null;
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const end = fromItem ?? (typeof legacy === "number" ? legacy : null);
  return end ? new Date(end * 1000).toISOString() : null;
}

export async function nestPriceLabel() {
  const stripeClient = getStripe();
  const priceId = getStripePriceId();
  if (!stripeClient || !priceId) return null;
  try {
    const price = await stripeClient.prices.retrieve(priceId);
    const amount = price.unit_amount ?? 0;
    const dollars = (amount / 100).toLocaleString("en-US", {
      style: "currency",
      currency: (price.currency || "usd").toUpperCase(),
      maximumFractionDigits: amount % 100 ? 2 : 0,
    });
    const interval = price.recurring?.interval ?? "month";
    return `${dollars}/${interval}`;
  } catch {
    return null;
  }
}
