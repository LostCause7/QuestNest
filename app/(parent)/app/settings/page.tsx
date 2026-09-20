import type { Metadata } from "next";
import { PageHeader } from "@/components/parent/page-header";
import { FamilySettingsForm, ParentPinForm, ProfileForm } from "@/components/parent/settings-forms";
import { requireFamily, requireUser } from "@/lib/data/family";
import { hasParentPin } from "@/lib/data/parent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const family = await requireFamily();
  const supabase = await createClient();
  const [{ data: profile }, pinSet] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    hasParentPin(family.id),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Your nest, your rules." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Section title="Family" description="Name, currency and timezone.">
            <FamilySettingsForm family={family} />
          </Section>
          <Section title="Parent PIN" description="Locks Kid Mode so kids can't wander into your dashboard.">
            <ParentPinForm hasPin={pinSet} />
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Your profile">
            <ProfileForm name={profile?.display_name ?? ""} />
            <p className="mt-3 text-xs text-muted-foreground">Signed in as {user.email}</p>
          </Section>
          <Section title="Account">
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-destructive hover:underline">Sign out</button>
            </form>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? <p className="mb-4 text-sm text-muted-foreground">{description}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}
