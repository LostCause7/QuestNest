import type { Metadata } from "next";
import { PageHeader } from "@/components/parent/page-header";
import { FamilySettingsForm, ParentPinForm, ProfileForm } from "@/components/parent/settings-forms";
import { MilestoneManager } from "@/components/parent/milestone-manager";
import { BonusRulesForm, NestLookForm } from "@/components/parent/fun-settings";
import { DataTools, DevicePrefsForm, InstallHowTo, WhatsNew } from "@/components/parent/nest-extras";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getFamilyMilestones, hasParentPin } from "@/lib/data/parent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const family = await requireFamily();
  const supabase = await createClient();
  const [profileRes, pinSet, extras] = await Promise.all([
    supabase.from("profiles").select("display_name, motto, avatar_key, color_key").eq("id", user.id).maybeSingle(),
    hasParentPin(family.id),
    getFamilyMilestones(family.id),
  ]);
  const fallback = profileRes.error && /column|schema cache|does not exist/i.test(profileRes.error.message)
    ? (await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()).data
    : null;
  const profile = profileRes.data ?? fallback;
  const motto = profile && "motto" in profile && typeof profile.motto === "string" ? profile.motto : "";
  const avatarKey = profile && "avatar_key" in profile && typeof profile.avatar_key === "string" ? profile.avatar_key : "luna";
  const colorKey = profile && "color_key" in profile && typeof profile.color_key === "string" ? profile.color_key : "sky";

  return (
    <>
      <PageHeader title="Settings" description="Your nest, your rules." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Section title="Family" description="Name, currency, timezone and home area for nearby rewards.">
            <FamilySettingsForm family={family} />
          </Section>
          <Section title="Parent PIN" description="Locks Kid Mode so kids can't wander into your dashboard.">
            <ParentPinForm hasPin={pinSet} />
          </Section>
          <Section
            title="Lifetime unlocks"
            description="Achievements from total points earned — not the spendable bank. Kids dress up with titles and frames."
          >
            <MilestoneManager family={family} extras={extras} />
          </Section>
          <Section title="Bonus rules" description="Free little surprises that keep kids coming back. Everything is 0 (off) until you turn it on.">
            <BonusRulesForm family={family} />
          </Section>
          <Section title="Nest look" description="Family letter crest and which Closet slots kids may change.">
            <NestLookForm family={family} />
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Your profile">
            <ProfileForm
              name={profile?.display_name ?? ""}
              motto={motto}
              avatarKey={avatarKey}
              colorKey={colorKey}
            />
            <p className="mt-3 text-xs text-muted-foreground">Signed in as {user.email}</p>
          </Section>
          <Section title="This device" description="Sounds, contrast, quiet hours, and how to install the app.">
            <DevicePrefsForm />
            <div className="mt-4 border-t pt-4">
              <InstallHowTo />
            </div>
          </Section>
          <Section title="What's new" id="whats-new">
            <WhatsNew />
          </Section>
          <Section title="Your data">
            <DataTools family={family} />
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="qn-glass-panel rounded-2xl border-2 border-slate-400/45 p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? <p className="mb-4 text-sm text-muted-foreground">{description}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}
