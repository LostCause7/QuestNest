import os from "os";
import { headers } from "next/headers";

function isRfc1918(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/** Prefer Ethernet/Wi-Fi LAN addresses; skip link-local 169.254 and loopback. */
export function lanIPv4() {
  const ifaces = os.networkInterfaces();
  const candidates: { name: string; address: string }[] = [];
  for (const [name, addrs] of Object.entries(ifaces)) {
    for (const addr of addrs ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      if (addr.address.startsWith("169.254.")) continue;
      candidates.push({ name, address: addr.address });
    }
  }
  const privateLan = candidates.find((c) => isRfc1918(c.address));
  return (privateLan ?? candidates[0])?.address ?? null;
}

export function isPrivateHost(host: string) {
  const h = host.split(":")[0];
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    isRfc1918(h)
  );
}

export async function requestHost() {
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
}

export async function networkAccessInfo() {
  const host = await requestHost();
  const hostname = host.split(":")[0];
  const port = host.includes(":") ? host.split(":").slice(1).join(":") : "3000";
  const lan = lanIPv4();
  const viaLan = isPrivateHost(hostname) && hostname !== "localhost" && hostname !== "127.0.0.1";
  return {
    currentUrl: `${viaLan || hostname === "localhost" ? "http" : "https"}://${host}`,
    lanUrl: lan ? `http://${lan}:${port}` : null,
    openedOnPhone: viaLan,
  };
}
