"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, Loader2Icon, MapPinIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KidAvatar } from "@/components/shared/avatar-picker";
import { RewardIcon } from "@/components/shared/reward-icon";
import { useAction } from "@/hooks/use-action";
import { suggestNearbyRewards, addNearbyRewards } from "@/lib/actions/places";
import { NEARBY_PAGE_SIZE } from "@/lib/places";
import { cn } from "@/lib/utils";
import type { NearbyPlace } from "@/lib/places";
import type { Child, Family } from "@/types/database";

export function NearbyRewardsButton({ family, kids }: { family: Family; kids: Child[] }) {
  const around = [family.location_city, family.location_state].filter(Boolean).join(", ");
  const hasHome = Boolean(family.location_city && family.location_state);
  const [open, setOpen] = useState(false);
  const [pagePlaces, setPagePlaces] = useState<NearbyPlace[] | null>(null);
  const [catalog, setCatalog] = useState<Map<string, NearbyPlace>>(() => new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState<NearbyPlace | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCost, setEditCost] = useState("");
  const [childIds, setChildIds] = useState<string[]>(kids.filter((k) => k.is_active).map((k) => k.id));
  const { run, pending } = useAction();

  const pageCount = Math.max(1, Math.ceil(total / NEARBY_PAGE_SIZE));

  const applyPage = (data: { places: NearbyPlace[]; page: number; total: number }) => {
    setPagePlaces(data.places);
    setPage(data.page);
    setTotal(data.total);
    setCatalog((prev) => {
      const next = new Map(prev);
      for (const p of data.places) if (!next.has(p.key)) next.set(p.key, p);
      return next;
    });
  };

  const fetchPage = (nextPage: number) => {
    setPagePlaces(null);
    setLoadError(null);
    setPreview(null);
    void run(() => suggestNearbyRewards({ page: nextPage }), {
      silent: true,
      onSuccess: (data) => {
        if (data) applyPage(data);
      },
    }).then((res) => {
      if (!res.ok) {
        setLoadError(res.error);
        setPagePlaces([]);
      }
    });
  };

  const load = () => {
    setOpen(true);
    setPagePlaces(null);
    setLoadError(null);
    setPicked(new Set());
    setCatalog(new Map());
    setPreview(null);
    setPage(1);
    setTotal(0);
    fetchPage(1);
  };

  const goTo = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount || nextPage === page || pending) return;
    fetchPage(nextPage);
  };

  const openPreview = (place: NearbyPlace) => {
    const current = catalog.get(place.key) ?? place;
    setPreview(current);
    setEditTitle(current.title);
    setEditCost(String(current.cost));
  };

  const draftFromPreview = (): NearbyPlace | null => {
    if (!preview) return null;
    const cost = Number.parseInt(editCost, 10);
    return {
      ...preview,
      title: editTitle.trim().slice(0, 80) || preview.title,
      cost: Number.isFinite(cost) && cost >= 0 ? cost : preview.cost,
    };
  };

  const selectPreview = () => {
    const draft = draftFromPreview();
    if (!draft) return;
    setCatalog((prev) => new Map(prev).set(draft.key, draft));
    setPicked((prev) => new Set(prev).add(draft.key));
    setPreview(null);
  };

  const selected = [...picked].map((key) => catalog.get(key)).filter((p): p is NearbyPlace => Boolean(p));

  if (!hasHome) {
    return (
      <Button variant="outline" asChild>
        <Link href="/app/settings">
          <MapPinIcon />
          <span className="hidden sm:inline">Set home area</span>
          <span className="sm:hidden">Area</span>
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={load}>
        <SparklesIcon />
        <span className="hidden sm:inline">Nearby places</span>
        <span className="sm:hidden">Nearby</span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPreview(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{preview.name}</DialogTitle>
                <DialogDescription>
                  Review this place, then add it or go back to the list.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                  <RewardIcon icon={preview.icon} className="size-14" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-medium">{preview.kind}</div>
                    <div className="text-sm text-muted-foreground">
                      {preview.miles < 10 ? preview.miles.toFixed(1) : Math.round(preview.miles)} miles from {around}
                    </div>
                    {preview.address ? (
                      <div className="text-sm text-muted-foreground">{preview.address}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No street address on the map for this one.</div>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                  <div className="space-y-1.5">
                    <Label htmlFor="place-title">Shop name</Label>
                    <Input id="place-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={80} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="place-cost">Cost</Label>
                    <Input
                      id="place-cost"
                      type="number"
                      min={0}
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
                  <ArrowLeftIcon />
                  Back to list
                </Button>
                <div className="flex gap-2">
                  {picked.has(preview.key) ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPicked((prev) => {
                          const next = new Set(prev);
                          next.delete(preview.key);
                          return next;
                        });
                        setPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                  <Button type="button" onClick={selectPreview} disabled={!editTitle.trim()}>
                    {picked.has(preview.key) ? "Update selection" : "Select for shop"}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Nearby shop ideas</DialogTitle>
                <DialogDescription>
                  8 closest places around {around} · within {family.location_radius_miles ?? 30} miles. Tap a place for
                  details. Page {page}
                  {total ? ` of ${pageCount}` : ""}.
                </DialogDescription>
              </DialogHeader>

              {!pagePlaces ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Looking around {around}…
                  </span>
                </div>
              ) : loadError ? (
                <div className="space-y-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                  <Button type="button" variant="outline" onClick={load} disabled={pending}>
                    Try again
                  </Button>
                </div>
              ) : pagePlaces.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No named places turned up around {around}. Try a bigger radius in Settings.
                </p>
              ) : (
                <div className="space-y-4">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {pagePlaces.map((p) => {
                      const on = picked.has(p.key);
                      return (
                        <li key={p.key}>
                          <button
                            type="button"
                            onClick={() => openPreview(p)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                              on ? "border-primary bg-primary/5" : "hover:bg-muted"
                            )}
                          >
                            <RewardIcon icon={p.icon} className="size-8" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.kind} · {p.miles < 10 ? p.miles.toFixed(1) : Math.round(p.miles)} mi
                              </span>
                            </span>
                            <Badge variant="secondary">
                              {p.cost} {family.currency_emoji}
                            </Badge>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" size="sm" disabled={pending || page <= 1} onClick={() => goTo(page - 1)}>
                      <ChevronLeftIcon />
                      Prev
                    </Button>
                    <div className="text-center text-xs text-muted-foreground">
                      Page {page} of {pageCount}
                      {total ? ` · ${total} nearby` : ""}
                    </div>
                    <Button type="button" variant="outline" size="sm" disabled={pending || page >= pageCount} onClick={() => goTo(page + 1)}>
                      Next
                      <ChevronRightIcon />
                    </Button>
                  </div>
                </div>
              )}

              {kids.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Add to these kids</div>
                  <div className="flex flex-wrap gap-2">
                    {kids.filter((k) => k.is_active).map((k) => {
                      const on = childIds.includes(k.id);
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => setChildIds((ids) => (ids.includes(k.id) ? ids.filter((x) => x !== k.id) : [...ids, k.id]))}
                          className={cn(
                            "flex items-center gap-2 rounded-full border-2 py-1 pr-3 pl-1 text-sm font-medium",
                            on ? "border-primary bg-primary/5" : "border-border opacity-70"
                          )}
                        >
                          <KidAvatar avatar={k.avatar} color={k.color} size="xs" />
                          {k.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={pending || selected.length === 0 || childIds.length === 0}
                  onClick={() =>
                    run(() => addNearbyRewards({ places: selected, child_ids: childIds }), {
                      onSuccess: () => setOpen(false),
                    })
                  }
                >
                  {pending ? <Loader2Icon className="animate-spin" /> : null}
                  Add {selected.length || ""} to shop
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
