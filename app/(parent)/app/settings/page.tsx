import type { Metadata } from "next";
import { PageHeader } from "@/components/parent/page-header";
import { FamilySettingsForm, ParentPinForm, ProfileForm } from "@/components/parent/settings-forms";
import { MilestoneManager } from "@/components/parent/milestone-manager";
import { BonusRulesForm, NestLookForm } from "@/components/parent/fun-settings";
import { DataTools, DevicePrefsForm, InstallHowTo, WhatsNew } from "@/components/parent/nest-extras";
import { requireFamily, requireUser } from "@/lib/data/family";
import { getActiveParentLook } from "@/lib/data/active-parent";
import { getFamilyMilestones, hasParentPin } from "@/lib/data/parent";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const family = await requireFamily();
  const [look, pinSet, extras] = await Promise.all([
    getActiveParentLook(family.id),
    hasParentPin(family.id),
    getFamilyMilestones(family.id),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Your nest, your rules." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Section title="Family" description="Name, currency, timezone and home area for nearby rewards.">
            <FamilySettingsForm family={family} />
          </Section>
          <Section
            title={look.source === "extra" ? "Your PIN" : "Parent PIN"}
            description={
              look.source === "extra"
                ? `Unlocks ${look.name} on the profile picker. The first parent's nest lock stays the same.`
                : "Locks Kid Mode so kids can't wander into your dashboard."
            }
          >
            <ParentPinForm hasPin={look.source === "extra" ? true : pinSet} extraParent={look.source === "extra"} />
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
              key={look.id}
              name={look.name}
              motto={look.motto}
              avatarKey={look.avatarKey}
              colorKey={look.colorKey}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              {look.source === "extra"
                ? `Using ${look.name}'s profile${user.email ? ` · nest account ${user.email}` : ""}`
                : `Signed in as ${user.email}`}
            </p>
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
