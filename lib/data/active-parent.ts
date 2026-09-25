import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data/family";
import { ACTIVE_PARENT_COOKIE } from "@/lib/supabase/proxy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ActiveParentLook = {
  source: "owner" | "extra";
  id: string;
  name: string;
  motto: string;
  avatarKey: string;
  colorKey: string;
  avatarUrl: string | null;
};

async function ownerLook(userId: string, email: string | null): Promise<ActiveParentLook> {
  const supabase = await createClient();
  const full = await supabase
    .from("profiles")
    .select("display_name, motto, avatar_key, color_key, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  const profile =
    full.error && /column|schema cache|does not exist/i.test(full.error.message)
      ? (await supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle()).data
      : full.data;
  const name =
    profile && "display_name" in profile && typeof profile.display_name === "string" && profile.display_name.trim()
      ? profile.display_name
      : (email?.split("@")[0] ?? "Parent");
  return {
    source: "owner",
    id: userId,
    name,
    motto: profile && "motto" in profile && typeof profile.motto === "string" ? profile.motto : "",
    avatarKey: profile && "avatar_key" in profile && typeof profile.avatar_key === "string" && profile.avatar_key ? profile.avatar_key : "luna",
    colorKey: profile && "color_key" in profile && typeof profile.color_key === "string" && profile.color_key ? profile.color_key : "sky",
    avatarUrl: profile && "avatar_url" in profile ? (profile.avatar_url as string | null) : null,
  };
}

/** The parent face currently using Parent HQ — extra PIN profile or nest owner. */
export const getActiveParentLook = cache(async (familyId: string): Promise<ActiveParentLook> => {
  const user = await requireUser();
  const extraId = (await cookies()).get(ACTIVE_PARENT_COOKIE)?.value;
  if (extraId && UUID.test(extraId)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("parent_profiles")
      .select("id, name, motto, avatar, color")
      .eq("id", extraId)
      .eq("family_id", familyId)
      .maybeSingle();
    if (data) {
      return {
        source: "extra",
        id: data.id,
        name: data.name,
        motto: data.motto ?? "",
        avatarKey: data.avatar || "luna",
        colorKey: data.color || "sky",
        avatarUrl: null,
      };
    }
  }
  return ownerLook(user.id, user.email);
});
