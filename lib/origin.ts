import { headers } from "next/headers";

/** Absolute origin of the current request (works on localhost, Vercel previews and prod). */
export async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Only allow relative, same-site redirect targets. */
export function safeNext(next: string | null | undefined, fallback = "/app") {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
