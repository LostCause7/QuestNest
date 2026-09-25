import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FamilyCrest } from "@/components/brand/family-crest";
import { Logo } from "@/components/brand/logo";
import { ProfilePicker } from "@/components/kid/profile-picker";
import { requireFamily } from "@/lib/data/family";
import { getOwnerParentLook } from "@/lib/data/active-parent";
import { getChildren, getParentProfiles } from "@/lib/data/parent";
import { KID_MODE_COOKIE } from "@/lib/supabase/proxy";

export const metadata: Metadata = { title: "Who's using the nest?" };

export default async function KidPickerPage() {
  const family = await requireFamily();
  const [kids, extraParents, owner] = await Promise.all([
    getChildren(family.id),
    getParentProfiles(family.id),
    getOwnerParentLook(),
  ]);
  const canAdd = (await cookies()).get(KID_MODE_COOKIE)?.value !== "1";
  const parentName = owner.name.split(" ")[0] || owner.name;
  const parentAvatar = owner.avatarUrl;
  const parentAvatarKey = owner.avatarKey;
  const parentColorKey = owner.colorKey;
  const parentMotto = owner.motto;

  return (
    <div className="qn-picker-chrome fixed inset-0 z-20 flex flex-col overflow-hidden text-white">
      <header className="flex items-center px-6 py-5">
        <Logo tone="light" size="sm" />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
          {family.style?.crestEmoji ? (
            <FamilyCrest mark={family.style.crestEmoji} color={family.style.crestColor} size="sm" />
          ) : null}
          {family.name}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-balance text-center sm:text-5xl">
          Who&apos;s using the nest?
        </h1>
        <p className="mt-3 max-w-md text-center text-lg text-white/65">
          Kids pick their face and enter their PIN. Extra parents use their own PIN.
        </p>
        {kids.length === 0 && canAdd ? (
          <p className="mt-10 max-w-sm text-center text-white/55">
            No kid profiles yet. Tap Add a kid to make one.
          </p>
        ) : null}
        <ProfilePicker
          kids={kids}
          extraParents={extraParents}
          canAdd={canAdd}
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
