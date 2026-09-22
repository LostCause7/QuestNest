import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { ProfilePicker } from "@/components/kid/profile-picker";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getChildren } from "@/lib/data/parent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Who's using the nest?" };

export default async function KidPickerPage() {
  const user = await requireUser();
  const family = await requireFamily();
  const kids = await getChildren(family.id);
  let parentName = user.email?.split("@")[0] ?? "Parent";
  let parentAvatar: string | null = null;
  let parentAvatarKey: string | null = null;
  let parentColorKey: string | null = null;
  let parentMotto: string | null = null;
  try {
    const supabase = await createClient();
    const full = await supabase
      .from("profiles")
      .select("display_name, avatar_url, avatar_key, color_key, motto")
      .eq("id", user.id)
      .maybeSingle();
    const profile =
      full.error && /column|schema cache|does not exist/i.test(full.error.message)
        ? (await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle()).data
        : full.data;
    parentName = profile?.display_name?.split(" ")[0] || parentName;
    parentAvatar = profile?.avatar_url ?? null;
    parentAvatarKey = profile && "avatar_key" in profile ? (profile.avatar_key as string | null) : null;
    parentColorKey = profile && "color_key" in profile ? (profile.color_key as string | null) : null;
    parentMotto = profile && "motto" in profile ? (profile.motto as string | null) : null;
  } catch {
    // Picker still works without the profile row.
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-nest-950 text-white">
      <header className="flex items-center px-6 py-5">
        <Logo tone="light" size="sm" />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{family.name}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-balance text-center sm:text-5xl">
          Who&apos;s using the nest?
        </h1>
        <p className="mt-3 max-w-md text-center text-lg text-white/60">
          Kids pick their face and enter their PIN. Parents pick theirs.
        </p>
        {kids.length === 0 ? (
          <p className="mt-10 max-w-sm text-center text-white/55">
            No kid profiles yet. Open the parent tile to add them in Parent HQ.
          </p>
        ) : null}
        <ProfilePicker
          kids={kids}
          parent={{
            name: parentName,
            avatarUrl: parentAvatar,
            avatarKey: parentAvatarKey,
            colorKey: parentColorKey,
            motto: parentMotto,
          }}
        />
      </main>
    </div>
  );
}
