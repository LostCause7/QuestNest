"use client";

import { useState } from "react";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PinInput } from "@/components/shared/pin-input";
import { useAction } from "@/hooks/use-action";
import { updateFamilySettings, setParentPin } from "@/lib/actions/family";
import { saveParentLook } from "@/lib/actions/style";
import { AvatarPicker, ColorPicker } from "@/components/shared/avatar-picker";
import { CURRENCY_PRESETS } from "@/lib/templates";
import { US_STATES } from "@/lib/places";
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
  const [city, setCity] = useState(family.location_city ?? "");
  const [state, setState] = useState(family.location_state ?? "");
  const [radius, setRadius] = useState(family.location_radius_miles ?? 30);
  const tzOptions = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];
  const stateOptions = state && !US_STATES.includes(state) ? [state, ...US_STATES] : US_STATES;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          updateFamilySettings({
            name,
            currency_name: currencyName,
            currency_emoji: emoji,
            timezone,
            location_city: city || null,
            location_state: state || null,
            location_radius_miles: radius,
          })
        );
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

      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <div>
          <Label>Home area for the shop</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Nearby ice cream, parks, movies and more are suggested for kids from this city. Same for every device on this nest.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1">
            <Label htmlFor="loc-city" className="text-xs">
              City
            </Label>
            <Input id="loc-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">State</Label>
            <Select value={state || "__none"} onValueChange={(v) => setState(v === "__none" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="TX" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__none">—</SelectItem>
                {stateOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor="loc-radius">Search radius</Label>
            <span className="tabular-nums text-muted-foreground">{radius} miles</span>
          </div>
          <input
            id="loc-radius"
            type="range"
            min={5}
            max={50}
            step={5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  );
}

export function ParentPinForm({ hasPin, extraParent = false }: { hasPin: boolean; extraParent?: boolean }) {
  const { run, pending } = useAction();
  const [pin, setPin] = useState("");
  const [editing, setEditing] = useState(!hasPin);
  const valid = extraParent ? /^\d{4}$/.test(pin) : /^\d{4,6}$/.test(pin);

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="size-5 text-emerald-600" />
          <div>
            <div className="text-sm font-medium">{extraParent ? "Your PIN is set" : "Parent PIN is set"}</div>
            <div className="text-xs text-muted-foreground">
              {extraParent
                ? "This unlocks your face on the profile picker."
                : "Required to open Parent HQ from the profile picker."}
            </div>
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
        {extraParent
          ? "This is the PIN for your face on the picker. It does not change the first parent's nest lock."
          : "Kids pick their own profile with their PIN. This PIN keeps them out of Parent HQ. Without one, anyone can open the parent tile."}
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

export function ProfileForm({
  name: initialName,
  motto: initialMotto = "",
  avatarKey: initialAvatar = "luna",
  colorKey: initialColor = "sky",
}: {
  name: string;
  motto?: string | null;
  avatarKey?: string | null;
  colorKey?: string | null;
}) {
  const { run, pending } = useAction();
  const [name, setName] = useState(initialName);
  const [motto, setMotto] = useState(initialMotto ?? "");
  const [avatar, setAvatar] = useState(initialAvatar || "luna");
  const [color, setColor] = useState(initialColor || "sky");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          saveParentLook({
            name,
            motto: motto.trim() || null,
            avatar_key: avatar,
            color_key: color,
          })
        );
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="prof-name">Your name</Label>
        <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prof-motto">Motto</Label>
        <Input
          id="prof-motto"
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
          placeholder="Chief of the nest"
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label>Your face</Label>
        <AvatarPicker value={avatar} onChange={setAvatar} color={color} catalog />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} catalog />
      </div>
      <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save look
      </Button>
    </form>
  );
}
