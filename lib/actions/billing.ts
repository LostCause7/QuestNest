"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getAuthOrigin } from "@/lib/site-url";
import { getStripe, getStripePriceId, isBillingConfigured, subscriptionPeriodEnd } from "@/lib/stripe";
import { nestIsSubscribed } from "@/lib/stripe-status";
import { fail, friendlyError, guardAction, ok, type ActionResult } from "./result";

const MISSING = /column|schema cache|does not exist/i;

async function saveCustomer(familyId: string, customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ stripe_customer_id: customerId } as never)
    .eq("id", familyId);
  if (error && !MISSING.test(error.message)) throw error;
}

async function saveSubscription(
  familyId: string,
  patch: {
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    subscription_status?: string | null;
    subscription_period_end?: string | null;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("families").update(patch as never).eq("id", familyId);
  if (error && !MISSING.test(error.message)) throw error;
}

export async function startNestCheckout(): Promise<ActionResult<{ url: string }>> {
  return guardAction(async () => {
    if (!isBillingConfigured()) return fail("Nest billing isn't connected yet. Add the Stripe keys first.");
    const stripe = getStripe();
    const priceId = getStripePriceId();
    if (!stripe || !priceId) return fail("Nest billing isn't connected yet.");

    const user = await requireUser();
    const family = await requireFamily();
    if (nestIsSubscribed(family.subscription_status)) return fail("This nest is already subscribed.");

    let customerId = family.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: family.name,
        metadata: { family_id: family.id },
      });
      customerId = customer.id;
      await saveCustomer(family.id, customerId);
    }

    const origin = getAuthOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: family.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/app/settings?billing=success`,
      cancel_url: `${origin}/app/settings?billing=cancel`,
      allow_promotion_codes: true,
      metadata: { family_id: family.id },
      subscription_data: {
        trial_period_days: 7,
        metadata: { family_id: family.id },
      },
    });
    if (!session.url) return fail("Stripe did not return a checkout link.");
    return ok({ url: session.url });
  });
}

export async function openBillingPortal(): Promise<ActionResult<{ url: string }>> {
  return guardAction(async () => {
    const stripe = getStripe();
    if (!stripe) return fail("Nest billing isn't connected yet.");
    const family = await requireFamily();
    if (!family.stripe_customer_id) return fail("This nest has no billing account yet.");
    const origin = getAuthOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer: family.stripe_customer_id,
      return_url: `${origin}/app/settings`,
    });
    if (!session.url) return fail("Could not open the billing portal.");
    return ok({ url: session.url });
  });
}

/** Pull the latest Stripe status after checkout return, if the webhook is slow. */
export async function syncNestSubscription(): Promise<ActionResult> {
  return guardAction(async () => {
    const stripe = getStripe();
    if (!stripe) return ok();
    const family = await requireFamily();
    if (!family.stripe_customer_id) return ok();

    const list = await stripe.subscriptions.list({
      customer: family.stripe_customer_id,
      status: "all",
      limit: 5,
    });
    const live = list.data.find((s) => nestIsSubscribed(s.status)) ?? list.data[0];
    if (!live) return ok();

    await saveSubscription(family.id, {
      stripe_subscription_id: live.id,
      subscription_status: live.status,
      subscription_period_end: subscriptionPeriodEnd(live),
    });
    return ok();
  });
}

export async function beginCheckout() {
  const res = await startNestCheckout();
  if (!res.ok) return res;
  if (res.data?.url) redirect(res.data.url);
  return fail("Stripe did not return a checkout link.");
}

export async function beginPortal() {
  const res = await openBillingPortal();
  if (!res.ok) return res;
  if (res.data?.url) redirect(res.data.url);
  return fail("Could not open the billing portal.");
}
