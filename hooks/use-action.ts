"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/result";

/**
 * Runs a server action, shows success/error toasts, and tracks pending state.
 * Returns the result so callers can close dialogs etc.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const run = useCallback(
    <T,>(
      fn: () => Promise<ActionResult<T>>,
      opts: { key?: string; silent?: boolean; onSuccess?: (data: T | undefined) => void } = {}
    ) =>
      new Promise<ActionResult<T>>((resolve) => {
        setBusyKey(opts.key ?? "__all");
        startTransition(async () => {
          try {
            const res = await fn();
            if (res.ok) {
              if (!opts.silent && res.message) toast.success(res.message);
              opts.onSuccess?.(res.data);
            } else {
              toast.error(res.error);
            }
            resolve(res);
          } catch (e) {
            // Let Next.js handle redirect()/notFound() thrown from server actions.
            if (isNextNavigationError(e)) throw e;
            const message = e instanceof Error ? e.message : "Something went wrong.";
            toast.error(message);
            resolve({ ok: false, error: message });
          } finally {
            setBusyKey(null);
          }
        });
      }),
    []
  );

  return { run, pending, busyKey, isBusy: (key: string) => pending && busyKey === key };
}

function isNextNavigationError(e: unknown) {
  const digest = (e as { digest?: string } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND");
}
