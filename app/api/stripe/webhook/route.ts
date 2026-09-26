import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, getStripeWebhookSecret, subscriptionPeriodEnd } from "@/lib/stripe";

export const runtime = "nodejs";

async function familyIdFor(event: Stripe.Event, stripe: Stripe) {
  const obj = event.data.object as {
    metadata?: { family_id?: string };
    client_reference_id?: string | null;
    customer?: string | { id?: string } | null;
    subscription?: string | { id?: string } | null;
    id?: string;
  };
  if (obj.metadata?.family_id) return obj.metadata.family_id;
  if (obj.client_reference_id) return obj.client_reference_id;

  const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.metadata?.family_id) return customer.metadata.family_id;
  }
  return null;
}

async function applySubscription(familyId: string, sub: Stripe.Subscription) {
  const admin = createAdminClient();
  if (!admin) return;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const { error } = await admin
    .from("families")
    .update({
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      subscription_period_end: subscriptionPeriodEnd(sub),
    } as never)
    .eq("id", familyId);
  if (error) console.error("stripe webhook family update", error.message);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = getStripeWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const familyId = await familyIdFor(event, stripe);
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (familyId && subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await applySubscription(familyId, sub);
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const familyId = sub.metadata?.family_id || (await familyIdFor(event, stripe));
      if (familyId) await applySubscription(familyId, sub);
    }
  } catch (error) {
    console.error("stripe webhook", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
