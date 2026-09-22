function readPublic(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  // Static access can be inlined at build; dynamic access still sees Vercel runtime env
  // if the Secret was missing during `next build`.
  const fromStatic =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const fromDynamic = process.env[name];
  return (fromStatic?.trim() || fromDynamic?.trim() || "");
}

/** Public Supabase env. Empty strings count as missing (Vercel often sets that). */
export function getSupabaseEnv() {
  const url = readPublic("NEXT_PUBLIC_SUPABASE_URL");
  const key = readPublic("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url, key };
}
