"use client";

import { useEffect, useMemo, useState } from "react";
import { DownloadIcon, PrinterIcon, SmartphoneIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { applyPrefs, chalkboardKey, readPrefs, writePrefs, type NestPrefs } from "@/lib/prefs";
import { exportFamilyBundle, type FamilyExport } from "@/lib/actions/export";
import { deleteFamilyData } from "@/lib/actions/export";
import { useAction } from "@/hooks/use-action";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import type { Child, Family, PointTransaction } from "@/types/database";

export function PrefsApplier() {
  useEffect(() => {
    applyPrefs();
  }, []);
  return null;
}

export function Chalkboard({ familyId }: { familyId: string }) {
  const [note, setNote] = useState("");
  useEffect(() => {
    try {
      setNote(window.localStorage.getItem(chalkboardKey(familyId)) ?? "");
    } catch {
      setNote("");
    }
  }, [familyId]);
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h3 className="font-medium">Household chalkboard</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">A note for this device — soccer practice, pizza night, grandma visiting.</p>
      <Textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          window.localStorage.setItem(chalkboardKey(familyId), e.target.value);
        }}
        maxLength={280}
        placeholder="Write a family note…"
        className="mt-3 min-h-24"
      />
    </section>
  );
}

export function FirstWeekCoach({
  hasKids,
  hasQuests,
  hasRewards,
}: {
  hasKids: boolean;
  hasQuests: boolean;
  hasRewards: boolean;
}) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    setHidden(window.localStorage.getItem("qn_coach_done") === "1");
  }, []);
  const steps = [
    { done: hasKids, label: "Add a kid" },
    { done: hasQuests, label: "Create a quest" },
    { done: hasRewards, label: "Add a reward" },
    { done: true, label: "Hand them the tablet" },
  ];
  if (hidden || steps.every((s) => s.done)) return null;
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">First-week setup</h3>
          <p className="text-xs text-muted-foreground">A short checklist so the nest feels alive tonight.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.localStorage.setItem("qn_coach_done", "1");
            setHidden(true);
          }}
        >
          Dismiss
        </Button>
      </div>
      <ol className="mt-3 space-y-1.5 text-sm">
        {steps.map((s) => (
          <li key={s.label} className={s.done ? "text-muted-foreground line-through" : "font-medium"}>
            {s.done ? "✓" : "○"} {s.label}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FamilyXpBar({ kids, family }: { kids: Child[]; family: Family }) {
  const xp = kids.reduce((s, k) => s + k.lifetime_points, 0);
  const goal = Math.max(200, Math.ceil(xp / 200) * 200 || 200);
  const pct = Math.min(100, Math.round((xp / goal) * 100));
  if (!kids.length) return null;
  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <h3 className="font-medium">Nest XP</h3>
        <span className="tabular-nums text-muted-foreground">
          {xp} / {goal} {family.currency_emoji}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-nest-gradient" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}

export function RivalBoard({
  kids,
  weeklyCounts,
}: {
  kids: Child[];
  weeklyCounts: Record<string, number>;
}) {
  if (kids.length < 2) return null;
  const ranked = [...kids].sort((a, b) => (weeklyCounts[b.id] ?? 0) - (weeklyCounts[a.id] ?? 0));
  return (
    <section className="rounded-2xl border bg-card p-4">
      <h3 className="font-medium">This week&apos;s friendly race</h3>
      <ol className="mt-3 space-y-2">
        {ranked.map((kid, i) => (
          <li key={kid.id} className="flex items-center justify-between text-sm">
            <span>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {kid.name}
            </span>
            <span className="tabular-nums text-muted-foreground">{weeklyCounts[kid.id] ?? 0} quests</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DevicePrefsForm() {
  const [prefs, setPrefs] = useState<NestPrefs>(readPrefs());
  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    window.addEventListener("qn-prefs", sync);
    return () => window.removeEventListener("qn-prefs", sync);
  }, []);
  const set = (patch: Partial<NestPrefs>) => setPrefs(writePrefs(patch));
  return (
    <div className="space-y-4">
      <ToggleRow
        label="Tap sounds"
        hint="Soft clicks on Done, shop, and PIN — stays on this device."
        checked={prefs.sounds}
        onChange={(sounds) => set({ sounds })}
      />
      <ToggleRow
        label="High contrast"
        hint="Stronger borders and type for Kid Mode."
        checked={prefs.highContrast}
        onChange={(highContrast) => set({ highContrast })}
      />
      <ToggleRow
        label="Bigger Kid Mode type"
        hint="Fewer words, larger text on the tablet."
        checked={prefs.bigType}
        onChange={(bigType) => set({ bigType })}
      />
      <ToggleRow
        label="Big tap targets"
        hint="Taller Done, Get it and PIN buttons for little hands."
        checked={prefs.bigTap}
        onChange={(bigTap) => set({ bigTap })}
      />
      <ToggleRow
        label="Left-handed PIN pad"
        hint="Moves the delete key to the bottom-left."
        checked={prefs.leftHanded}
        onChange={(leftHanded) => set({ leftHanded })}
      />
      <ToggleRow
        label="Pattern textures"
        hint="Done and waiting cards get stripes and dots, so status isn't color-only."
        checked={prefs.colorPatterns}
        onChange={(colorPatterns) => set({ colorPatterns })}
      />
      <ToggleRow
        label="Ambient hum"
        hint="A very quiet background tone while a kid is on their screen. Off by default."
        checked={prefs.ambient}
        onChange={(ambient) => set({ ambient })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="quiet-start" className="text-xs">
            Quiet hours start
          </Label>
          <Input id="quiet-start" type="time" value={prefs.quietStart} onChange={(e) => set({ quietStart: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="quiet-end" className="text-xs">
            Quiet hours end
          </Label>
          <Input id="quiet-end" type="time" value={prefs.quietEnd} onChange={(e) => set({ quietEnd: e.target.value })} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Parent HQ hides live “kid finished a quest” toasts during quiet hours.</p>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function InstallHowTo() {
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p className="flex items-start gap-2">
        <SmartphoneIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong className="text-foreground">iPhone / iPad:</strong> Share → Add to Home Screen. Opens the profile picker.
        </span>
      </p>
      <p>
        <strong className="text-foreground">Android / Chrome:</strong> browser menu → Install app or Add to Home screen.
      </p>
    </div>
  );
}

export function WhatsNew() {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      <li>
        <strong className="text-foreground">Profiles.</strong> Kids pick their face. Parents pick theirs and enter a PIN.
      </li>
      <li>
        <strong className="text-foreground">Lifetime unlocks.</strong> Titles, frames, and stickers open from total points earned — spending never takes them away. Add nest unlocks in Settings.
      </li>
      <li>
        <strong className="text-foreground">Nearby shop.</strong> Suggest parks, ice cream, and more from OpenStreetMap.
      </li>
      <li>
        <strong className="text-foreground">Send back notes.</strong> Tell a kid what to fix when a quest isn&apos;t ready.
      </li>
    </ul>
  );
}

export function DataTools({ family }: { family: Family }) {
  const { run, pending } = useAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() =>
          run(() => exportFamilyBundle(), {
            onSuccess: (data) => {
              if (!data) return;
              downloadJson(`${family.name.replace(/\s+/g, "-").toLowerCase()}-chorehall.json`, data);
            },
          })
        }
      >
        <DownloadIcon />
        Export nest JSON
      </Button>
      <Button variant="outline" className="w-full text-destructive" onClick={() => setConfirmDelete(true)}>
        <Trash2Icon />
        Delete my data
      </Button>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this nest?"
        description="This permanently removes kids, quests, rewards, and history for this family. You will be signed out."
        confirmLabel="Delete everything"
        pending={pending}
        onConfirm={() => run(() => deleteFamilyData())}
      />
    </div>
  );
}

export function CsvExportButton({
  rows,
  filename,
}: {
  rows: PointTransaction[];
  filename: string;
}) {
  const csv = useMemo(() => toCsv(rows), [rows]);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => downloadText(filename, csv, "text/csv")}
    >
      <DownloadIcon />
      CSV
    </Button>
  );
}

export function PrintButton({ label = "Print week" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <PrinterIcon />
      {label}
    </Button>
  );
}

function toCsv(rows: PointTransaction[]) {
  const header = "date,kid_id,amount,kind,note";
  const body = rows
    .map((r) =>
      [r.created_at, r.child_id, r.amount, r.kind, JSON.stringify(r.note ?? "")].join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

function downloadJson(name: string, data: FamilyExport) {
  downloadText(name, JSON.stringify(data, null, 2), "application/json");
}

function downloadText(name: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
