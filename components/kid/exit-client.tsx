"use client";

import { useTransition } from "react";
import { Loader2Icon, UnlockIcon } from "lucide-react";
import { PinScreen } from "@/components/kid/pin-screen";
import { exitKidMode } from "@/lib/actions/kid-mode";

export function ExitClient({ next, hasPin, header }: { next: string; hasPin: boolean; header: React.ReactNode }) {
  const [pending, startTransition] = useTransition();

  if (!hasPin) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {header}
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => exitKidMode(null, next).then(() => undefined))}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-60"
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <UnlockIcon />}
          Go to Parent HQ
        </button>
      </div>
    );
  }

  return <PinScreen header={header} variableLength onSubmit={(pin) => exitKidMode(pin, next)} hint="4 to 6 digits" />;
}
