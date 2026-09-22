"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ParentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Parent HQ hit a snag</h1>
      <p className="text-muted-foreground">Try again. If it keeps happening, sign out and sign back in.</p>
      <div className="flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in again</Link>
        </Button>
      </div>
    </div>
  );
}
