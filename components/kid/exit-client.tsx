import type { ReactNode } from "react";
import { UnlockIcon } from "lucide-react";
import { PinScreen } from "@/components/kid/pin-screen";
import { PIN_KEY_ACTION } from "@/lib/pin-key-path";

export function ExitClient({
  next,
  hasPin,
  header,
  draft = "",
  error = null,
  path = "/kids/parent",
}: {
  next: string;
  hasPin: boolean;
  header: ReactNode;
  draft?: string;
  error?: string | null;
  path?: "/kids/parent" | "/kids/exit";
}) {
  if (!hasPin) {
    return (
      <form method="POST" action={PIN_KEY_ACTION} autoComplete="off" className="flex w-full max-w-sm flex-col items-center gap-8">
        {header}
        <input type="hidden" name="role" value="parent-open" />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="path" value={path} />
        <button
          type="submit"
          name="key"
          value="open"
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-md"
        >
          <UnlockIcon />
          Go to Parent HQ
        </button>
      </form>
    );
  }

  return (
    <PinScreen
      header={header}
      draft={draft}
      error={error}
      variableLength
      hidden={{ role: "parent", id: "", next, path }}
    />
  );
}
