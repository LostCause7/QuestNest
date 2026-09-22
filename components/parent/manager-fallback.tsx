import { Skeleton } from "@/components/ui/skeleton";

export function ManagerFallback({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ParentShellFallback() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar md:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 border-b" />
        <div className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-6xl space-y-4">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-72" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
