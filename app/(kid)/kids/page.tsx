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
      <header className="flex items-center justify-between px-6 py-5">
        <Logo tone="light" size="sm" />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Sign out
          </button>
        </form>
      </header>
      <main id="main" className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-16">
        <section className="relative mb-6 flex flex-col items-center sm:mb-8">
          <div
            className="pointer-events-none absolute top-4 size-40 rounded-full bg-sky-200/20 blur-3xl sm:size-52"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-4 rounded-[2rem] border border-white/25 bg-white/10 px-8 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_18px_40px_rgba(2,6,23,0.38)] backdrop-blur-md sm:flex-row sm:gap-5 sm:px-8 sm:py-5">
            <FamilyCrest
              mark={family.style?.crestEmoji || family.name}
              color={family.style?.crestColor}
              size="xl"
              className="shadow-[0_10px_24px_rgba(2,6,23,0.4)] ring-white/70"
            />
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Family nest
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
                {family.name}
              </h1>
            </div>
          </div>
        </section>
        <h2 className="font-display text-2xl font-semibold text-balance text-center text-white sm:text-3xl">
          Who&apos;s using the nest?
        </h2>
        <p className="mt-2 max-w-md text-center text-base text-white/65 sm:text-lg">
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
