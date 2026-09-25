"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";
import { deleteFamilyMilestone, upsertFamilyMilestone } from "@/lib/actions/style";
import { LIFETIME_MILESTONES } from "@/lib/milestones";
import type { Family, FamilyMilestone } from "@/types/database";

export function MilestoneManager({ family, extras }: { family: Family; extras: FamilyMilestone[] }) {
  const { run, pending } = useAction();
  const [points, setPoints] = useState("200");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🎖️");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Built-in unlocks open from lifetime {family.currency_name.toLowerCase()} — not the banked balance. Add your
        own nest unlocks below (a title at a lifetime total you choose).
      </p>
      <ul className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
        {LIFETIME_MILESTONES.map((m) => (
          <li key={m.key}>
            {m.icon} {m.points} · {m.name}
          </li>
        ))}
      </ul>
      <form
        className="grid gap-3 sm:grid-cols-[5rem_1fr_4.5rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number.parseInt(points, 10);
          if (!title.trim() || !Number.isFinite(n)) return;
          run(() => upsertFamilyMilestone({ lifetime_points: n, title: title.trim(), icon }), {
            onSuccess: () => {
              setTitle("");
            },
          });
        }}
      >
        <div className="space-y-1">
          <Label className="text-xs">At</Label>
          <Input value={points} onChange={(e) => setPoints(e.target.value)} type="number" min={1} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unlock name</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie Night Champ" maxLength={40} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Icon</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="text-center text-lg" maxLength={8} />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending || !title.trim()}>
            <PlusIcon />
            Add
          </Button>
        </div>
      </form>
      {extras.length ? (
        <ul className="space-y-2">
          {extras.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
              <span className="text-xl">{m.icon}</span>
              <span className="flex-1">
                {m.lifetime_points} lifetime · {m.title}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => deleteFamilyMilestone(m.id))}
                aria-label={`Remove ${m.title}`}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No custom nest unlocks yet. The built-in track still works.</p>
      )}
    </div>
  );
}
