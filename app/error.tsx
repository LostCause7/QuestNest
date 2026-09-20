"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Logo />
      <div className="text-7xl">🪹</div>
      <h1 className="font-display text-3xl font-semibold">Something fell out of the nest</h1>
      <p className="max-w-sm text-muted-foreground">
        We hit an unexpected error. Try again, and if it keeps happening, sign out and back in.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
      {error.digest ? <p className="text-xs text-muted-foreground">Ref: {error.digest}</p> : null}
    </main>
  );
}
