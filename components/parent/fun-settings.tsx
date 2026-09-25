"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { FamilyCrest } from "@/components/brand/family-crest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";
import { updateFamilyBonuses, updateFamilyStyle } from "@/lib/actions/family";
import { CREST_COLORS, CREST_LETTERS, resolveCrestColor, resolveCrestLetter } from "@/lib/crests";
import { ROOM_ITEMS, STYLE_SLOTS } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";
import type { Family } from "@/types/database";

const LOCKABLE = STYLE_SLOTS.map((s) => ({ key: s.kind, label: s.label }));

export function NestLookForm({ family }: { family: Family }) {
  const { run, pending } = useAction();
  const s = family.style ?? {};
  const [room, setRoom] = useState<string | null>(s.room ?? null);
  const [locked, setLocked] = useState<string[]>(s.lockedSlots ?? []);
  const [crestEmoji, setCrestEmoji] = useState(resolveCrestLetter(s.crestEmoji) ?? "");
  const [crestColor, setCrestColor] = useState(resolveCrestColor(s.crestColor));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          updateFamilyStyle({
            room,
            sky: null,
            seasonalStickers: false,
            lockedSlots: locked,
            crestEmoji: crestEmoji || null,
            crestColor: crestColor || null,
          })
        );
      }}
    >
      <div className="space-y-3">
        <div>
          <Label>Family crest</Label>
          <p className="text-xs text-muted-foreground">A single letter for the picker and Parent HQ — last-name initial works well. Then pick a metal tint.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-400/40 bg-slate-950/40 p-3">
          <FamilyCrest mark={crestEmoji || "A"} color={crestColor} size="lg" />
          <div>
            <div className="font-display text-base font-semibold">{crestEmoji ? `Letter ${crestEmoji}` : "No crest"}</div>
            <div className="text-xs text-muted-foreground">{CREST_COLORS.find((c) => c.key === crestColor)?.label} metal</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
          {CREST_LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setCrestEmoji(crestEmoji === letter ? "" : letter)}
              aria-pressed={crestEmoji === letter}
              className="qn-choice qn-lift flex items-center justify-center rounded-2xl p-1.5"
              aria-label={`Letter ${letter}`}
            >
              <FamilyCrest mark={letter} color={crestColor} size="md" />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CREST_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCrestColor(c.key)}
              aria-pressed={crestColor === c.key}
              className="qn-choice flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
            >
              <span className={cn("size-4 rounded-full bg-gradient-to-br ring-1 ring-slate-500/40", c.fill)} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Nest room</Label>
          <p className="text-xs text-muted-foreground">
            Default backdrop for kids. Lock the Room slot below if you want this look for everyone.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" aria-pressed={room === null} onClick={() => setRoom(null)} className="qn-choice qn-lift overflow-hidden rounded-2xl text-left">
            <div className="h-16 bg-[linear-gradient(135deg,#e2e8f0,#94a3b8,#cbd5e1)]" />
            <div className="px-2.5 py-2 text-sm font-semibold">Kid&apos;s choice</div>
          </button>
          {ROOM_ITEMS.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={room === r.key}
              onClick={() => setRoom(r.key)}
              className="qn-choice qn-lift overflow-hidden rounded-2xl text-left"
            >
              <div className="kid-mode relative h-16 overflow-hidden" data-room={r.key}>
                <div className="qn-kid-sky absolute inset-0" />
                <div className="qn-room-blob-a absolute -top-6 -left-4 size-16 rounded-full opacity-90 blur-xl" />
                <div className="qn-room-blob-b absolute -right-4 top-1 size-14 rounded-full opacity-80 blur-xl" />
              </div>
              <div className="px-2.5 py-2 text-sm font-semibold">{r.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Locked slots</Label>
        <p className="text-xs text-muted-foreground">Locked slots can&apos;t be changed by kids. Handy for school-photo week.</p>
        <div className="flex flex-wrap gap-2">
          {LOCKABLE.map((slot) => {
            const on = locked.includes(slot.key);
            return (
              <Chip key={slot.key} on={on} onClick={() => setLocked(on ? locked.filter((k) => k !== slot.key) : [...locked, slot.key])}>
                {on ? "🔒 " : ""}
                {slot.label}
              </Chip>
            );
          })}
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save nest look
      </Button>
    </form>
  );
}

export function BonusRulesForm({ family }: { family: Family }) {
  const { run, pending } = useAction();
  const [daily, setDaily] = useState(family.daily_bonus_points ?? 0);
  const [combo, setCombo] = useState(family.combo_bonus_points ?? 0);
  const [surprise, setSurprise] = useState(family.surprise_chance ?? 0);
  const [perfect, setPerfect] = useState(family.perfect_day_points ?? 0);
  const cur = family.currency_emoji;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateFamilyBonuses({ daily_bonus_points: daily, combo_bonus_points: combo, surprise_chance: surprise, perfect_day_points: perfect }));
      }}
    >
      <NumberRow id="bonus-daily" label={`First quest of the day bonus (${cur})`} hint="Paid once per day with the first approved quest." value={daily} onChange={setDaily} max={1000} />
      <NumberRow id="bonus-combo" label={`Combo bonus (${cur})`} hint="Paid when the third quest of the day is approved." value={combo} onChange={setCombo} max={1000} />
      <NumberRow
        id="bonus-surprise"
        label="Surprise chance (%)"
        hint="Odds of a random nest egg (1 to the quest's points) on the first approval each day."
        value={surprise}
        onChange={setSurprise}
        max={100}
      />
      <NumberRow id="bonus-perfect" label={`Perfect day bonus (${cur})`} hint="Paid when every quest due today is approved." value={perfect} onChange={setPerfect} max={1000} />
      <p className="text-xs text-muted-foreground">0 turns a rule off. Bonuses show up in the ledger as “bonus” and celebrate live on the kid&apos;s screen.</p>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}
        Save bonus rules
      </Button>
    </form>
  );
}

function NumberRow({
  id,
  label,
  hint,
  value,
  onChange,
  max,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <div className="qn-choice grid grid-cols-[1fr_6rem] items-center gap-3 rounded-2xl px-3 py-2.5">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
        className="text-right tabular-nums"
      />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("qn-choice inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium", on && "bg-white/15")}
    >
      {children}
    </button>
  );
}
