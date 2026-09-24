function hostOf(value: string) {
  return value.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
}

/** Public nest — confirmation emails and auth callbacks must use this, never a Vercel alias. */
export const CANONICAL_ORIGIN = "https://chorehall.net";

/** Vercel deployment aliases — never put these in confirmation emails. */
export function isVercelDeploymentHost(value: string) {
  const host = hostOf(value);
  return host.endsWith(".vercel.app") || host === "vercel.app" || host.endsWith(".vercel.com");
}

function originFromHost(host: string, proto = "https") {
  return `${proto}://${host.replace(/^https?:\/\//, "")}`;
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

/** Absolute site origin that is always a valid URL for `new URL()`. */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // fall through
    }
  }
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production && !isVercelDeploymentHost(production)) {
    return originFromHost(production);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return originFromHost(vercel);
  }
  return "http://localhost:3000";
}

/**
 * Origin used in signup / reset emails and after the auth callback.
 * Never returns a *.vercel.app host — those pages can ask families to
 * create a Vercel account because of Deployment Protection.
 */
export function getAuthOrigin(requestHost?: string | null) {
  if (requestHost) {
    const host = hostOf(requestHost);
    if (isLocalHost(host)) {
      return originFromHost(requestHost.split("/")[0], "http");
    }
  }

  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_ORIGIN;
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      const origin = new URL(explicit).origin;
      if (!isVercelDeploymentHost(origin) && !isLocalHost(hostOf(origin))) return origin;
    } catch {
      // fall through
    }
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production && !isVercelDeploymentHost(production)) {
    return originFromHost(production);
  }

  if (requestHost) {
    const host = hostOf(requestHost);
    if (!isVercelDeploymentHost(host)) {
      return originFromHost(host);
    }
  }

  return CANONICAL_ORIGIN;
}
