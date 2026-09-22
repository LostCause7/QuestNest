"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPicker } from "@/components/shared/icon-picker";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { useAction } from "@/hooks/use-action";
import { createChore, updateChore, type ChoreInput } from "@/lib/actions/chores";
import { CHORE_ICONS } from "@/lib/templates";
import { suggestQuestPoints } from "@/lib/suggested-points";
import { WEEKDAYS } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { Child, Family, Recurrence } from "@/types/database";
import type { ChoreWithKids } from "@/lib/data/parent";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  chore?: ChoreWithKids | null;
  /** Prefill for "add from library" */
  preset?: Partial<ChoreInput> | null;
  kids: Child[];
  family: Family;
};

export function ChoreDialog({ open, onOpenChange, chore, preset, kids, family }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <ChoreForm
          key={chore?.id ?? preset?.title ?? "new"}
          chore={chore ?? null}
          preset={preset ?? null}
          kids={kids}
          family={family}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ChoreForm({
  chore,
  preset,
  kids,
  family,
  onClose,
}: {
  chore: ChoreWithKids | null;
  preset: Partial<ChoreInput> | null;
  kids: Child[];
  family: Family;
  onClose: () => void;
}) {
  const editing = Boolean(chore);
  const { run, pending } = useAction();
  const src = chore ?? preset;

  const [title, setTitle] = useState(src?.title ?? "");
  const [description, setDescription] = useState((src && "description" in src && src.description) || "");
  const [icon, setIcon] = useState(src?.icon ?? "🧹");
  const [points, setPoints] = useState(String(src?.points ?? 10));
  const [recurrence, setRecurrence] = useState<Recurrence>((src?.recurrence as Recurrence) ?? "daily");
  const [days, setDays] = useState<number[]>(src?.days_of_week?.length ? src.days_of_week : [1, 2, 3, 4, 5]);
  const [requiresApproval, setRequiresApproval] = useState(src?.requires_approval ?? true);
  const [childIds, setChildIds] = useState<string[]>(
    chore?.child_ids ?? (kids.length === 1 ? [kids[0].id] : kids.map((k) => k.id))
  );

  const pts = Number.parseInt(points, 10);
  const needsDays = recurrence === "weekly" || recurrence === "custom";
  const canSave =
    title.trim().length > 0 && Number.isFinite(pts) && pts >= 0 && childIds.length > 0 && (!needsDays || days.length > 0);

  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));
  const toggleKid = (id: string) => setChildIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const submit = async () => {
    const payload: ChoreInput = {
      title: title.trim(),
      description: description.trim() || null,
      icon,
      points: pts,
      recurrence,
      days_of_week: needsDays ? days : [0, 1, 2, 3, 4, 5, 6],
      requires_approval: requiresApproval,
      child_ids: childIds,
    };
    await run(() => (editing && chore ? updateChore(chore.id, payload) : createChore(payload)), {
      onSuccess: onClose,
    });
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Edit quest" : "New quest"}</DialogTitle>
          <DialogDescription>Set what it&apos;s worth, when it repeats, and who it&apos;s for.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex gap-3">
            <IconPicker value={icon} onChange={setIcon} options={CHORE_ICONS} />
            <div className="flex-1 space-y-2">
              <Label htmlFor="q-title">Quest name</Label>
              <Input
                id="q-title"
                value={title}
                onChange={(e) => {
                  const next = e.target.value;
                  setTitle(next);
                  if (!editing && (!points || points === "10")) setPoints(String(suggestQuestPoints(next)));
                }}
                placeholder="Make your bed"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-desc">Details (optional)</Label>
            <Textarea id="q-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pillows on top, blanket pulled up, stuffies in a row." rows={2} maxLength={300} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="q-points">Reward ({family.currency_name})</Label>
              <div className="relative">
                <Input id="q-points" type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} className="pr-9" />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">{family.currency_emoji}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Suggested from the title — change it anytime.</p>
            </div>
            <div className="space-y-2">
              <Label>Repeats</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="custom">Specific days</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="once">One time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsDays ? (
            <div className="space-y-2">
              <Label>Which days?</Label>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((d) => {
                  const on = days.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Assign to</Label>
            {kids.length ? (
              <div className="flex flex-wrap gap-2">
                {kids.map((k) => {
                  const on = childIds.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => toggleKid(k.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-sm font-medium transition-colors",
                        on ? "border-primary bg-primary/5" : "border-border opacity-70"
                      )}
                    >
                      <KidAvatar avatar={k.avatar} color={k.color} size="xs" />
                      {k.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add a kid first.</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-sm font-medium">Needs your approval</div>
              <div className="text-xs text-muted-foreground">
                {requiresApproval ? "Points are awarded after you approve." : "Points are awarded instantly when they check it off."}
              </div>
            </div>
            <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : null}
            {editing ? "Save quest" : "Create quest"}
          </Button>
        </DialogFooter>
    </>
  );
}
