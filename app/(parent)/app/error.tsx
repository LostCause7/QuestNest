"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ParentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Parent HQ hit a snag</h1>
      <p className="text-muted-foreground">Try again. If it keeps happening, sign out and sign back in.</p>
      {error.message ? (
        <p className="rounded-xl bg-muted px-3 py-2 text-left text-xs text-muted-foreground break-words">
          {error.message.includes("#441")
            ? "The dashboard failed while drawing this nest. Tap Try again after a refresh."
            : error.message}
        </p>
      ) : null}
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in again</Link>
        </Button>
      </div>
    </div>
  );
}
