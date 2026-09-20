"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  LibraryIcon,
  SwordsIcon,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { EmptyState } from "@/components/parent/page-header";
import { ChoreDialog } from "@/components/parent/chore-dialog";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import { useAction } from "@/hooks/use-action";
import { deleteChore, setChoreActive, type ChoreInput } from "@/lib/actions/chores";
import { describeSchedule } from "@/lib/schedule";
import { AGE_BANDS, CHORE_PACKS, type AgeBand } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { Child, Family } from "@/types/database";
import type { ChoreWithKids } from "@/lib/data/parent";

export function ChoresManager({ chores, kids, family }: { chores: ChoreWithKids[]; kids: Child[]; family: Family }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { run, pending, isBusy } = useAction();

  const openedViaQuery = searchParams.get("new") === "1";
  const [dialogOpen, setDialogOpen] = useState(openedViaQuery);
  const [editing, setEditing] = useState<ChoreWithKids | null>(null);
  const [preset, setPreset] = useState<Partial<ChoreInput> | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [deleting, setDeleting] = useState<ChoreWithKids | null>(null);
  const [kidFilter, setKidFilter] = useState<string>("all");

  useEffect(() => {
    if (openedViaQuery) router.replace("/app/chores");
  }, [openedViaQuery, router]);

  const kidMap = useMemo(() => new Map(kids.map((k) => [k.id, k])), [kids]);
  const filtered = chores.filter((c) => kidFilter === "all" || c.child_ids.includes(kidFilter));
  const active = filtered.filter((c) => c.is_active);
  const paused = filtered.filter((c) => !c.is_active);

  const openNew = (p?: Partial<ChoreInput>) => {
    setEditing(null);
    setPreset(p ?? null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {kids.length > 1 ? (
          <Tabs value={kidFilter} onValueChange={setKidFilter}>
            <TabsList>
              <TabsTrigger value="all">Everyone</TabsTrigger>
              {kids.map((k) => (
                <TabsTrigger key={k.id} value={k.id} className="gap-1.5">
                  <KidAvatar avatar={k.avatar} color={k.color} size="xs" className="size-5 text-xs" />
                  {k.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLibraryOpen(true)}>
            <LibraryIcon />
            Quest library
          </Button>
          <Button onClick={() => openNew()}>
            <PlusIcon />
            New quest
          </Button>
        </div>
      </div>

      {active.length === 0 && paused.length === 0 ? (
        <EmptyState icon={<SwordsIcon className="size-7 text-primary" />} title="No quests yet" description="Create your first quest or grab a few from the library.">
          <Button variant="outline" onClick={() => setLibraryOpen(true)}>
            <LibraryIcon />
            Browse library
          </Button>
          <Button onClick={() => openNew()}>
            <PlusIcon />
            New quest
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((c) => (
            <ChoreCard
              key={c.id}
              chore={c}
              family={family}
              kidMap={kidMap}
              busy={isBusy(c.id)}
              onEdit={() => {
                setEditing(c);
                setPreset(null);
                setDialogOpen(true);
              }}
              onToggle={() => run(() => setChoreActive(c.id, false), { key: c.id })}
              onDelete={() => setDeleting(c)}
            />
          ))}
        </ul>
      )}

      {paused.length ? (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-muted-foreground">Paused</h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paused.map((c) => (
              <ChoreCard
                key={c.id}
                chore={c}
                family={family}
                kidMap={kidMap}
                paused
                busy={isBusy(c.id)}
                onEdit={() => {
                  setEditing(c);
                  setPreset(null);
                  setDialogOpen(true);
                }}
                onToggle={() => run(() => setChoreActive(c.id, true), { key: c.id })}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <ChoreDialog open={dialogOpen} onOpenChange={setDialogOpen} chore={editing} preset={preset} kids={kids} family={family} />

      <QuestLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        family={family}
        existingTitles={new Set(chores.map((c) => c.title.toLowerCase()))}
        onPick={(p) => {
          setLibraryOpen(false);
          openNew(p);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="Past completions stay in the activity log, but the quest disappears from everyone's board. You can pause it instead."
        pending={pending}
        onConfirm={() => deleting && run(() => deleteChore(deleting.id), { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

function ChoreCard({
  chore,
  family,
  kidMap,
  paused,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  chore: ChoreWithKids;
  family: Family;
  kidMap: Map<string, Child>;
  paused?: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const assigned = chore.child_ids.map((id) => kidMap.get(id)).filter(Boolean) as Child[];
  return (
    <li className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm", paused && "opacity-60")}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">{chore.icon}</span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="block truncate text-left font-medium hover:underline">
            {chore.title}
          </button>
          <div className="text-xs text-muted-foreground">{describeSchedule(chore)}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More" disabled={busy}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              {paused ? (
                <>
                  <PlayIcon /> Resume
                </>
              ) : (
                <>
                  <PauseIcon /> Pause
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {chore.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{chore.description}</p> : null}
      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex -space-x-1.5">
          {assigned.map((k) => (
            <KidAvatar key={k.id} avatar={k.avatar} color={k.color} size="xs" className="ring-2 ring-card" />
          ))}
          {assigned.length === 0 ? <span className="text-xs text-muted-foreground">Unassigned</span> : null}
        </div>
        <div className="flex items-center gap-1.5">
          {!chore.requires_approval ? (
            <Badge variant="outline" className="gap-1 text-[11px]">
              <CheckIcon className="size-3" /> Auto
            </Badge>
          ) : null}
          <Badge className="bg-sun-300/50 text-foreground hover:bg-sun-300/50">
            +{chore.points} {family.currency_emoji}
          </Badge>
        </div>
      </div>
    </li>
  );
}

function QuestLibrary({
  open,
  onOpenChange,
  family,
  existingTitles,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  family: Family;
  existingTitles: Set<string>;
  onPick: (p: Partial<ChoreInput>) => void;
}) {
  const [band, setBand] = useState<AgeBand>("middle");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Quest library</DialogTitle>
          <DialogDescription>Pick a starting point, then tweak points, schedule and who it&apos;s for.</DialogDescription>
        </DialogHeader>
        <Tabs value={band} onValueChange={(v) => setBand(v as AgeBand)}>
          <TabsList className="w-full">
            {AGE_BANDS.map((b) => (
              <TabsTrigger key={b.key} value={b.key} className="flex-1">
                {b.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CHORE_PACKS[band].map((t) => {
            const exists = existingTitles.has(t.title.toLowerCase());
            return (
              <li key={t.title}>
                <button
                  type="button"
                  onClick={() =>
                    onPick({
                      title: t.title,
                      icon: t.icon,
                      points: t.points,
                      recurrence: t.recurrence,
                      days_of_week: t.days_of_week,
                      requires_approval: t.requires_approval ?? true,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {describeSchedule({ recurrence: t.recurrence, days_of_week: t.days_of_week ?? [0, 1, 2, 3, 4, 5, 6] })}
                      {exists ? " · already added" : ""}
                    </span>
                  </span>
                  <Badge variant="secondary">
                    +{t.points} {family.currency_emoji}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
