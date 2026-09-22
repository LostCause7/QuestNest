import { headers } from "next/headers";
import { getAuthOrigin, getSiteUrl, isVercelDeploymentHost } from "@/lib/site-url";

/** Absolute origin of the current request (works on localhost, Vercel previews and prod). */
export async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const hostname = host.split(":")[0];
    const local =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
    const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
    return `${proto}://${host}`;
  }
  return getSiteUrl();
}

/** Origin for confirmation / reset emails. Never a protected *.vercel.app URL. */
export async function getEmailOrigin() {
  const h = await headers();
  return getAuthOrigin(h.get("x-forwarded-host") ?? h.get("host"));
}

export function publicCallbackOrigin(request: { headers: Headers; url: string }) {
  const forwarded = request.headers.get("x-forwarded-host");
  const fromAuth = getAuthOrigin(forwarded);
  if (!isVercelDeploymentHost(fromAuth)) return fromAuth;
  return getAuthOrigin(new URL(request.url).host);
}

/** Only allow relative, same-site redirect targets. */
export function safeNext(next: string | null | undefined, fallback = "/kids") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
