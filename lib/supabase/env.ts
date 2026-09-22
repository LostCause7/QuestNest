function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  // Static NEXT_PUBLIC_ reads so a successful Vercel build can still inline them.
  if (names.includes("NEXT_PUBLIC_SUPABASE_URL")) {
    const inline = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (inline) return inline;
  }
  if (names.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || names.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    const inline =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (inline) return inline;
  }
  return "";
}

export type SupabasePublicEnv = { url: string; key: string };

declare global {
  interface Window {
    __QN_SUPABASE__?: SupabasePublicEnv;
  }
}

/** Public Supabase env. Empty strings count as missing (Vercel often sets that). */
export function getSupabaseEnv(): SupabasePublicEnv | null {
  if (typeof window !== "undefined") {
    const injected = window.__QN_SUPABASE__;
    if (injected?.url && injected?.key) {
      try {
        new URL(injected.url);
        return injected;
      } catch {
        // fall through to process.env
      }
    }
  }

  const url = firstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const key = firstEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY"
  );
  if (!url || !key) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url, key };
}

/** Inline script so the browser still gets keys if they were missing at `next build`. */
export function supabaseEnvBootstrapScript(env: SupabasePublicEnv) {
  return `window.__QN_SUPABASE__=${JSON.stringify({ url: env.url, key: env.key })};`;
}
