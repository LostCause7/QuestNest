"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { startNestCheckout, openBillingPortal, syncNestSubscription } from "@/lib/actions/billing";
import { nestIsSubscribed } from "@/lib/stripe-status";

export function BillingCard({
  status,
  periodEnd,
  configured,
  priceLabel,
  syncOnLoad = false,
}: {
  status?: string | null;
  periodEnd?: string | null;
  configured: boolean;
  priceLabel?: string | null;
  syncOnLoad?: boolean;
}) {
  const router = useRouter();
  const { run, pending } = useAction();
  const live = nestIsSubscribed(status);
  const trial = status === "trialing";

  useEffect(() => {
    if (!syncOnLoad) return;
    void (async () => {
      await syncNestSubscription();
      router.refresh();
    })();
  }, [syncOnLoad, router]);

  const when = periodEnd
    ? new Date(periodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
        <CreditCardIcon className="mt-0.5 size-5 text-sky-400" />
        <div>
          <div className="text-sm font-medium">
            {trial ? "7-day free trial" : live ? "This nest is subscribed" : "One subscription for the whole nest"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Every parent and kid on this account is covered. Kids never pay separately.
            {priceLabel ? ` ${priceLabel} after a 7-day free trial.` : " Starts with a 7-day free trial."}
            {trial && when ? ` First charge ${when}.` : live && when ? ` Renews ${when}.` : ""}
          </p>
        </div>
      </div>

      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Add your Stripe secret key, price, and webhook in the host env to take payments.
        </p>
      ) : live ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(() => openBillingPortal(), {
              silent: true,
              onSuccess: (data) => {
                if (data?.url) window.location.href = data.url;
              },
            })
          }
        >
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Manage billing
        </Button>
      ) : (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => startNestCheckout(), {
              silent: true,
              onSuccess: (data) => {
                if (data?.url) window.location.href = data.url;
              },
            })
          }
        >
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Start 7-day free trial
        </Button>
      )}
    </div>
  );
}
