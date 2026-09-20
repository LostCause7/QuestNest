"use client";

import { useState } from "react";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinInput } from "@/components/shared/pin-input";
import { useAction } from "@/hooks/use-action";
import { updateFamilySettings, setParentPin, updateProfileName } from "@/lib/actions/family";
import { CURRENCY_PRESETS } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { Family } from "@/types/database";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];

export function FamilySettingsForm({ family }: { family: Family }) {
  const { run, pending } = useAction();
  const [name, setName] = useState(family.name);
  const [currencyName, setCurrencyName] = useState(family.currency_name);
  const [emoji, setEmoji] = useState(family.currency_emoji);
  const [timezone, setTimezone] = useState(family.timezone);
  const tzOptions = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateFamilySettings({ name, currency_name: currencyName, currency_emoji: emoji, timezone }));
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fam-name">Family name</Label>
        <Input id="fam-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>
        <div className="flex flex-wrap gap-2">
          {CURRENCY_PRESETS.map((p) => {
            const on = p.name === currencyName && p.emoji === emoji;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setCurrencyName(p.name);
                  setEmoji(p.emoji);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium",
                  on ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {p.emoji} {p.name}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-3 pt-1">
          <div className="space-y-1">
            <Label htmlFor="cur-emoji" className="text-xs">
              Emoji
            </Label>
            <Input id="cur-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="text-center text-xl" maxLength={8} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cur-name" className="text-xs">
              Name (plural)
            </Label>
            <Input id="cur-name" value={currencyName} onChange={(e) => setCurrencyName(e.target.value)} maxLength={20} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {tzOptions.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Decides when “today” rolls over for quests and streaks.</p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  );
}

export function ParentPinForm({ hasPin }: { hasPin: boolean }) {
  const { run, pending } = useAction();
  const [pin, setPin] = useState("");
  const [editing, setEditing] = useState(!hasPin);
  const valid = /^\d{4,6}$/.test(pin);

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="size-5 text-emerald-600" />
          <div>
            <div className="text-sm font-medium">Parent PIN is set</div>
            <div className="text-xs text-muted-foreground">Required to leave Kid Mode.</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setParentPin(pin), {
          onSuccess: () => {
            setPin("");
            setEditing(false);
          },
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Kids will need this PIN to exit Kid Mode and return to your dashboard. Without one, anyone can tap “I&apos;m a parent”.
      </p>
      <PinInput value={pin} onChange={setPin} length={4} masked={false} className="mx-auto w-fit" />
      <div className="flex justify-center gap-2">
        {hasPin ? (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={!valid || pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {hasPin ? "Update PIN" : "Set parent PIN"}
        </Button>
      </div>
    </form>
  );
}

export function ProfileForm({ name: initial }: { name: string }) {
  const { run, pending } = useAction();
  const [name, setName] = useState(initial);
  return (
    <form
      className="flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateProfileName(name));
      }}
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="prof-name">Your name</Label>
        <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>
      <Button type="submit" variant="outline" disabled={pending || name.trim() === initial}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
