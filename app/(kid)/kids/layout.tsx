import { requireFamily } from "@/lib/data/family";
import { isNextRedirect } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children }: LayoutProps<"/kids">) {
  try {
    await requireFamily();
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error(error);
    const message = error instanceof Error ? error.message : "We couldn't open kid mode.";
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Kid mode hit a snag</h1>
        <p className="text-sm text-muted-foreground">
          Try again. If this started after a kindness trophy, run 0029_cast_ledger_kinds.sql in Supabase.
        </p>
        <p className="rounded-xl bg-muted px-3 py-2 text-left text-xs text-muted-foreground break-words">{message}</p>
      </div>
    );
  }
  return (
    <div className="kid-mode relative min-h-screen overflow-x-visible bg-background text-foreground">
      {/* playful background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-sun-400/70 blur-3xl" />
        <div className="absolute top-1/3 -right-32 size-[28rem] rounded-full bg-nest-300/70 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 size-[26rem] rounded-full bg-mint-400/60 blur-3xl" />
      </div>
      {children}
    </div>
  );
}
