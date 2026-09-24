"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, MoreHorizontalIcon, PencilIcon, CoinsIcon, ArchiveIcon, ArchiveRestoreIcon, Trash2Icon, FlameIcon, TrophyIcon, UsersIcon, HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { EmptyState } from "@/components/parent/page-header";
import { KidDialog } from "@/components/parent/kid-dialog";
import { AdjustPointsDialog } from "@/components/parent/adjust-points-dialog";
import { ConfirmDialog } from "@/components/parent/confirm-dialog";
import { KudosDialog } from "@/components/parent/kudos-dialog";
import { useAction } from "@/hooks/use-action";
import { deleteChild, setChildActive } from "@/lib/actions/children";
import { levelInfo } from "@/lib/levels";
import { childLook, frameClass } from "@/lib/milestones";
import { nameplateClassName } from "@/lib/cosmetics";
import { colorTheme } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import type { Child, Family } from "@/types/database";

export function KidsManager({ kids, family, gifts = {} }: { kids: Child[]; family: Family; gifts?: Record<string, string[]> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { run, pending } = useAction();

  const openedViaQuery = searchParams.get("new") === "1";
  const [dialogOpen, setDialogOpen] = useState(openedViaQuery);
  const [editing, setEditing] = useState<Child | null>(null);
  const [adjusting, setAdjusting] = useState<Child | null>(null);
  const [deleting, setDeleting] = useState<Child | null>(null);
  const [cheering, setCheering] = useState<Child | null>(null);

  useEffect(() => {
    if (openedViaQuery) router.replace("/app/kids");
  }, [openedViaQuery, router]);

  const active = kids.filter((k) => k.is_active);
  const archived = kids.filter((k) => !k.is_active);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          Print PIN card
        </Button>
        <Button onClick={openNew}>
          <PlusIcon />
          Add a kid
        </Button>
      </div>

      {active.length === 0 ? (
        <EmptyState icon={<UsersIcon className="size-7 text-primary" />} title="No kids yet" description="Add your first kid to start assigning quests and stocking their shop.">
          <Button onClick={openNew}>
            <PlusIcon />
            Add a kid
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((kid) => (
            <KidCard
              key={kid.id}
              kid={kid}
              family={family}
              onEdit={() => {
                setEditing(kid);
                setDialogOpen(true);
              }}
              onAdjust={() => setAdjusting(kid)}
              onCheer={() => setCheering(kid)}
              onArchive={() => run(() => setChildActive(kid.id, false))}
              onDelete={() => setDeleting(kid)}
            />
          ))}
        </div>
      )}

      {archived.length ? (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-muted-foreground">Archived</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((kid) => (
              <KidCard
                key={kid.id}
                kid={kid}
                family={family}
                archived
                onEdit={() => {
                  setEditing(kid);
                  setDialogOpen(true);
                }}
                onAdjust={() => setAdjusting(kid)}
                onCheer={() => setCheering(kid)}
                onArchive={() => run(() => setChildActive(kid.id, true))}
                onDelete={() => setDeleting(kid)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="hidden print:block">
        <h2 className="font-display text-2xl font-semibold">ChoreHall PIN reminder</h2>
        <p className="mt-1 text-sm">Write each kid&apos;s PIN in the box. Keep this on the fridge, not in a kid&apos;s backpack.</p>
        <ul className="mt-6 grid gap-4">
          {active.map((kid) => (
            <li key={kid.id} className="flex items-center gap-4 rounded-xl border p-4">
              <span className="font-display text-xl font-semibold">{kid.name}</span>
              <span className="ml-auto h-10 w-32 rounded-lg border-2 border-dashed" />
            </li>
          ))}
        </ul>
      </div>

      <KidDialog open={dialogOpen} onOpenChange={setDialogOpen} child={editing} />
      <AdjustPointsDialog open={Boolean(adjusting)} onOpenChange={(o) => !o && setAdjusting(null)} child={adjusting} family={family} />
      <KudosDialog open={Boolean(cheering)} onOpenChange={(o) => !o && setCheering(null)} child={cheering} gifted={cheering ? gifts[cheering.id] ?? [] : []} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${deleting?.name}?`}
        description="This permanently deletes their quests history, points and badges. Consider archiving instead."
        confirmLabel="Delete forever"
        pending={pending}
        onConfirm={() =>
          deleting && run(() => deleteChild(deleting.id), { onSuccess: () => setDeleting(null) })
        }
      />
    </>
  );
}

function KidCard({
  kid,
  family,
  archived,
  onEdit,
  onAdjust,
  onCheer,
  onArchive,
  onDelete,
}: {
  kid: Child;
  family: Family;
  archived?: boolean;
  onEdit: () => void;
  onAdjust: () => void;
  onCheer: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const lvl = levelInfo(kid.lifetime_points);
  const look = childLook(kid.style, { seasonal: family.style?.seasonalStickers !== false });
  const theme = colorTheme(kid.color);
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm", archived && "opacity-60")}>
      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", theme.gradient)} />
      <div className="flex items-start gap-3">
        <Link href={`/app/kids/${kid.id}`}>
          <KidAvatar
            avatar={kid.avatar}
            color={kid.color}
            size="md"
            sticker={look.sticker}
            hat={look.hat}
            aura={look.aura}
            frameClassName={frameClass(look.frame)}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/kids/${kid.id}`}
            className={cn("block truncate font-display text-lg font-semibold hover:underline", nameplateClassName(look.nameplate))}
          >
            {kid.nickname?.trim() || kid.name}
          </Link>
          <div className="text-sm text-muted-foreground">
            Level {lvl.level} · {look.title || lvl.title}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon /> Edit / reset PIN
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAdjust}>
              <CoinsIcon /> Adjust {family.currency_name.toLowerCase()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive}>
              {archived ? (
                <>
                  <ArchiveRestoreIcon /> Restore
                </>
              ) : (
                <>
                  <ArchiveIcon /> Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label={family.currency_name} value={kid.points_balance} emoji={family.currency_emoji} />
        <Stat label="Streak" value={kid.current_streak} icon={<FlameIcon className="size-3.5 text-orange-500" />} />
        <Stat label="Lifetime" value={kid.lifetime_points} icon={<TrophyIcon className="size-3.5 text-amber-500" />} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={onAdjust}>
          <CoinsIcon />
          Bonus / deduct
        </Button>
        <Button variant="outline" size="sm" onClick={onCheer}>
          <HeartIcon className="text-rose-500" />
          Kudos / gift
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, emoji, icon }: { label: string; value: number; emoji?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-2">
      <div className="flex items-center justify-center gap-1 font-display text-lg font-semibold tabular-nums">
        {icon}
        {value}
        {emoji ? <span className="text-sm">{emoji}</span> : null}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
