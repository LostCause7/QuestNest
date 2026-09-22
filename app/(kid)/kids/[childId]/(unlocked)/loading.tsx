import { Skeleton } from "@/components/ui/skeleton";

export default function KidLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44 bg-card" />
          <Skeleton className="h-4 w-32 bg-card" />
        </div>
        <Skeleton className="h-10 w-14 bg-card" />
      </div>
      <Skeleton className="h-3 w-full rounded-full bg-card" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl bg-card" />
        ))}
      </div>
    </div>
  );
}
