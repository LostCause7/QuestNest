import { WifiIcon } from "lucide-react";
import { networkAccessInfo } from "@/lib/lan";

export async function NetworkAccessCard() {
  const info = await networkAccessInfo();
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <WifiIcon className="mt-0.5 size-5 text-primary" />
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium">On this Wi‑Fi</div>
          <p className="text-xs text-muted-foreground">
            This PC can be on Ethernet and the phones on Wi‑Fi. If they use the same home router (not a guest network), type this address on the phone. The page switches between phone and desktop layout on its own.
          </p>
          {info.lanUrl ? (
            <p className="break-all rounded-lg bg-background px-2.5 py-2 font-mono text-xs">
              {info.lanUrl}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Couldn&apos;t detect a home-network address.</p>
          )}
          {info.openedOnPhone ? (
            <p className="text-xs text-emerald-700">You&apos;re on this page from a device on the network.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Skip guest Wi‑Fi. If it won&apos;t load, Windows Firewall may be blocking port 3000 on this PC.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
